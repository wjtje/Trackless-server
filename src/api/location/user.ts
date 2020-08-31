// Copyright (c) 2020 Wouter van der Wal

import express from 'express'
import unusedRequestTypes from '../../scripts/RequestHandler/unusedRequestType'
import authHandler from '../../scripts/RequestHandler/authHandler'
import { DBcon } from '../..'
import { handleQuery } from '../../scripts/handle'
import moment from 'moment'
import _ from 'lodash'

const router = express.Router()

// Get last used
router.get(
  '/:userId/last',
  authHandler('trackless.location.read'),
  (request, response, next) => {
    // Get last locationId from the server
    DBcon.query(
      'SELECT `locationId`, `name`, `place`, `id` FROM `TL_work` INNER JOIN `TL_locations` USING (`locationId`) WHERE `userId`=? AND `locationId`!=0 ORDER BY `workId` DESC LIMIT 1',
      [(request.params.userId === '~') ? request.user?.userId : request.params.userId],
      handleQuery(next, (result) => {
        response.status(200).json(result)
      })
    )
  }
)

// Get most used
router.get(
  '/:userId/most',
  authHandler('trackless.location.read'),
  (request, response, next) => {
    // Get two random locations
    DBcon.query(
      'SELECT r1.locationId, r1.name, r1.place, r1.id FROM `TL_locations` AS r1 JOIN (SELECT CEIL(RAND() * (SELECT MAX(locationId) FROM `TL_locations`)) AS locationId) AS r2 WHERE r1.locationId >= r2.locationId ORDER BY r1.locationId ASC LIMIT 2',
      handleQuery(next, (randomLocations) => {
        // Get most used locationId from the server (limit 2)
        DBcon.query(
          'SELECT `locationId`, `name`, `place`, `id`, COUNT(`locationId`) as `occurrence` FROM `TL_work` INNER JOIN `TL_locations` USING (`locationId`) WHERE `userId` = ? AND `locationId`!=0 AND `date` >= ? AND `date` <= ? GROUP BY `locationId` ORDER BY `occurrence` DESC LIMIT 2',
          [
            request.user?.userId,
            moment().subtract(7, 'days').format('YYYY-MM-DD'), // Last week
            moment().format('YYYY-MM-DD') // Now
          ],
          handleQuery(next, (result) => {
            // Return to the user
            response.status(200).json([
              _.get(result, '[0]', randomLocations[0]),
              _.get(result, '[1]', randomLocations[1])
            ])
          })
        )
      })
    )
  }
)

router.use(unusedRequestTypes())

export default router
