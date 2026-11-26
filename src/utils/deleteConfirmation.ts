export interface DeleteConfirmation {
  email: string;
  code: string;
}

export const deleteConfirmationRequestConfig = ({ email, code }: DeleteConfirmation) => ({
  params: { email },
  headers: { 'X-Internxt-2FA-Code': code },
});
