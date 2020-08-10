import { Request, Response, NextFunction } from 'express';
import ServerError from "./serverErrorInterface";

export default function unusedRequestTypes() {
  return (request:Request, response:Response, next:NextFunction) => {
    const error: ServerError = new Error("This request type does not exists on route");
    error.status = 404;
    error.code = 'trackless.router.requestError';
    next(error);
  };
}
