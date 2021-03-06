// Copyright (c) 2020 Wouter van der Wal

import {Request, Response, NextFunction} from 'express'
import ServerError from '../../classes/server-error'

/**
 * This will check if the request.query.limit or offset is in use and will
 * generate the correct sql commands.
 * The results will be saved in request.queryLimitOffset
 */
const limitOffsetHandler = () => {
	return (request: Request, response: Response, next: NextFunction) => {
		// Check if limit or offset is used
		if (request.query?.limit === null) {
			// Check if the values are valid
			// Allow an empty offset
			if (!Number.isNaN(Number(request.query.limit)) && !Number.isNaN(Number(request.query.offset ?? ''))) {
				request.queryLimitOffset =
          `LIMIT ${Number(request.query.limit ?? 0)} OFFSET ${Number(request.query.offset ?? 0)}`
				next()
			} else {
				// The offset of limit is not valid
				next(new ServerError(
					'Wrong limit/offset option',
					400,
					'trackless.limit.wrong'
				))
			}
		} else {
			next()
		}
	}
}

export default limitOffsetHandler
