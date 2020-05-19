import { DBcon } from "..";
import { handleQuery, responseDone } from "../scripts";
import _ = require("lodash");
import { newApi, handleReject } from "../api";

function wrongType(res, req) {
  res.send(JSON.stringify({
    status: 400,
    message: `Please check the documentation. group_id needs to be a number and not a ${typeof req.params.group_id}.`
  }));
  res.status(400);
}

// List a group
newApi("get", '/group/:group_id', [
  {name: "apiKey", type: "string"}
], (request, response) => {
  // Check if the data is correct
  if (typeof Number(request.params.group_id) === "number") {
    // Get all the basic information from the group
    DBcon.query(
      "SELECT * FROM `TL_groups` WHERE `group_id`=?",
      [request.params.group_id],
      handleQuery(response, `Could not list the group. Does it exsist?`, (resultGroup) => {
        // Get all users
        DBcon.query(
          "SELECT `user_id`, `firstname`, `lastname`, `username` FROM `TL_users` WHERE `group_id`=?",
          [request.params.group_id],
          handleQuery(response, `Could not find any users.`, (result) => {
            responseDone(response, {
              result: {
                group_id: Number(request.params.group_id),
                groupName: _.get(resultGroup, '[0].groupName', 'undefined'),
                users: result
              }
            })
          })
        );
      })
    );
  } else {
    wrongType(response, request);
  }
}, handleReject());

// Delete a group
newApi("delete", '/group/:group_id', [
  {name: "apiKey", type: "string"}
], (request, response) => {
  // Check if the data is correct
  if (typeof Number(request.params.group_id) === "number" && Number(request.params.group_id) !== 0 && Number(request.params.group_id) !== 1) {
    // Get all the basic information from the group
    DBcon.query(
      "DELETE FROM `TL_groups` WHERE `group_id`=?",
      [request.params.group_id],
      handleQuery(response, `Could not list the group. Does it exsist?`, () => {
        DBcon.query(
          "UPDATE `TL_users` SET `group_id`=0 WHERE `group_id`=?",
          [request.params.group_id]
        );

        responseDone(response);
      })
    );
  } else {
    wrongType(response, request);
  }
}, handleReject());

// Edit a group
newApi("patch", '/group/:group_id', [
  {name: "apiKey", type: "string"},
  {name: "groupName", type: "string"}
], (request, response) => {
  // Check if the data is correct
  if (typeof Number(request.params.group_id) === "number" && Number(request.params.group_id) !== 0 && Number(request.params.group_id) !== 1) {
    // Get all the basic information from the group
    DBcon.query(
      "UPDATE `TL_groups` SET `groupName`=? WHERE `group_id`=?",
      [
        request.body.groupName,
        request.params.group_id
      ],
      handleQuery(response, `Could not save the change`, () => {
        responseDone(response);
      })
    );
  } else {
    wrongType(response, request);
  }
}, handleReject());