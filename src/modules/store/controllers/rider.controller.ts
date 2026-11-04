import { Request, Response } from "express";
import { sendResponse, buildErrorResponse } from "../../../shared";
import { listRiders, assignRider } from "../services/rider.service";

export const handleListRiders = async (
  _req: Request,
  res: Response
): Promise<Response> => {
  try {
    const data = await listRiders();
    return sendResponse(
      { statusCode: 200, showMessage: false, message: "Riders fetched", data },
      res
    );
  } catch (error) {
    return sendResponse(buildErrorResponse(error), res);
  }
};

export const handleAssignRider = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const data = await assignRider(req.storeId!, req.params.orderId, req.body.riderId);
    return sendResponse(
      {
        statusCode: 200,
        showMessage: true,
        message: `Assigned to ${data.rider?.name ?? "rider"}`,
        data,
      },
      res
    );
  } catch (error) {
    return sendResponse(buildErrorResponse(error), res);
  }
};
