// Copyright (c) 2020 Wouter van der Wal

import {Request, Response, NextFunction} from 'express'
import _ from 'lodash'
import ServerError from '../../classes/server-error'
import {requireObject} from './interface'

/**
 * An express RequestHandler to check if a user has given all the required info
 *
 * @since 0.4-beta.0
 */
const requireHandler = (require: requireObject[]) => {
	return (request: Request, response: Response, next: NextFunction) => {
		// Run everything async for more speed
		Promise.all(require.map(async i => {
			return new Promise((resolve, reject) => {
				if (!_.has(request.body, i.name)) {
					// It is missing
					reject(new Error(`missing: ${i.name}`))
				} else if (i.check(_.get(request.body, i.name))) {
					// The given value is correct
					resolve(null)
				} else {
					// Something is wrong with that value
					reject(new Error(`wrong: ${i.name}`))
				}
			})
		})).then(() => {
			next()
		}).catch((error_: Error) => {
			// The user is missing something
			next(new ServerError(error_.message, 400, 'trackless.require.failed'))
		})
	}
}

export default requireHandler
