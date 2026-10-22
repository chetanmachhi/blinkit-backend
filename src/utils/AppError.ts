export class AppError extends Error {
  public readonly statusCode: number;
  public readonly showMessage: boolean;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number,
    showMessage: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.showMessage = showMessage;
    this.isOperational = true;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}
