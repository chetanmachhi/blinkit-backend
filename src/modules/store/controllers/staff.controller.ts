import { Request, Response } from "express";
import {
  ResponseModel,
  sendResponse,
  buildErrorResponse,
} from "../../../shared";
import {
  getStaffList,
  createStaffMember,
  updateStaffMember,
  resetStaffPassword,
} from "../services/staff.service";

export const handleGetStaff = async (
  _req: Request,
  res: Response
): Promise<Response> => {
  const response: ResponseModel = {
    statusCode: 200,
    showMessage: false,
    message: "Staff members fetched",
  };
  try {
    const staff = await getStaffList();
    response.data = staff;
    return sendResponse(response, res);
  } catch (error) {
    return sendResponse(buildErrorResponse(error), res);
  }
};

export const handleCreateStaff = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const response: ResponseModel = {
    statusCode: 201,
    showMessage: true,
    message: "Staff member added successfully",
  };
  try {
    const staff = await createStaffMember(req.body);
    response.data = staff;
    return sendResponse(response, res);
  } catch (error) {
    return sendResponse(buildErrorResponse(error), res);
  }
};

export const handleUpdateStaff = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const response: ResponseModel = {
    statusCode: 200,
    showMessage: true,
    message: "Staff member updated successfully",
  };
  try {
    const actingUserId = req.user!.id;
    const targetUserId = req.params.userId;
    const staff = await updateStaffMember(actingUserId, targetUserId, req.body);
    response.data = staff;
    return sendResponse(response, res);
  } catch (error) {
    return sendResponse(buildErrorResponse(error), res);
  }
};

export const handleResetPassword = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const response: ResponseModel = {
    statusCode: 200,
    showMessage: true,
    message: "Staff password reset successfully. Sessions invalidated.",
  };
  try {
    const targetUserId = req.params.userId;
    await resetStaffPassword(targetUserId, req.body.newPassword);
    return sendResponse(response, res);
  } catch (error) {
    return sendResponse(buildErrorResponse(error), res);
  }
};
