export interface ResponseModel<T = any> {
  statusCode: number;
  showMessage: boolean;
  message: string;
  data?: T;
  error?: any;
}
