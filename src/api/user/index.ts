// Copyright (c) 2020 Wouter van der Wal

import {Router as expressRouter} from 'express'
import unusedRequestTypes from '../../scripts/RequestHandler/unused-request-type'
import authHandler from '../../scripts/RequestHandler/auth-handler'
import {DBcon} from '../..'
import {handleQuery} from '../../scripts/handle'
import ServerError from '../../scripts/RequestHandler/server-error-interface'
import {storePassword} from '../../scripts/security'
import requireHandler from '../../scripts/RequestHandler/require-handler'
import {mysqlTEXT, mysqlINT, mysqlVARCHAR} from '../../scripts/types'
import userIDRouter from './user-id'
import sortHandler from '../../scripts/RequestHandler/sort-handler'
import workRoute from './work'
import workIDRoute from './work-id'
import accessRoute from './access'
import locationRoute from './location'
import settingRoute from './setting'
import limitOffsetHandler from '../../scripts/RequestHandler/limit-offset-handler'

const router = expressRouter()

// Get all the users from the system
router.get(
	'/',
	authHandler('trackless.user.readAll'),
	sortHandler([
		'userID',
		'firstname',
		'lastname',
		'username',
		'groupID',
		'groupName'
	]),
	limitOffsetHandler(),
	(request, response, next) => {
		// Send the request
		DBcon.query(
			'SELECT `userID`, `firstname`, `lastname`, `username`, `groupID`, `groupName` FROM `TL_users` INNER JOIN `TL_groups` USING (`groupID`) ' +
      `${request.querySort ?? ' ORDER BY `firstname`, `lastname`, `username`'} ${request.queryLimitOffset ?? ''}`,
			handleQuery(next, result => {
				response.status(200).json(result)
			})
		)
	}
)

// Create a new user
router.post(
	'/',
	authHandler('trackless.user.create'),
	requireHandler([
		{name: 'firstname', check: mysqlTEXT},
		{name: 'lastname', check: mysqlTEXT},
		{name: 'username', check: mysqlVARCHAR(64)},
		{name: 'password', check: mysqlTEXT},
		{name: 'groupID', check: mysqlINT}
	]),
	(request, response, next) => {
		// Check if the user is taken
		DBcon.query(
			'SELECT `username` FROM `TL_users` WHERE `username`=?',
			[request.body.username],
			handleQuery(next, result => {
				if (result.length > 0) {
					// Username is taken
					const error: ServerError = new Error('Username has been taken')
					error.status = 400
					error.code = 'trackless.user.usernameTaken'
					next(error)
				} else {
					// Create a new user
					// Store the password
					const [salt, hash] = storePassword(request.body.password)

					// Commit to the database
					DBcon.query(
						'INSERT INTO `TL_users` ( `firstname`, `lastname`, `username`, `groupID`, `salt_hash`, `hash` ) VALUES ( ?, ?, ?, ?, ?, ?)',
						[
							request.body.firstname,
							request.body.lastname,
							request.body.username,
							Number(request.body.groupID),
							salt,
							hash
						],
						handleQuery(next, result => {
							response.status(201).json({
								userID: result.insertId
							})
						})
					)
				}
			})
		)
	}
)

router.use(userIDRouter)
router.use(workRoute)
router.use(workIDRoute)
router.use(accessRoute)
router.use(locationRoute)
router.use(settingRoute)

router.use(unusedRequestTypes())

export default router
