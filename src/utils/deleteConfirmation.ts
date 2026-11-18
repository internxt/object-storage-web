export interface DeleteConfirmation {
  name: string;
  code: string;
}

export const deleteConfirmationRequestConfig = ({ name, code }: DeleteConfirmation) => ({
  params: { name },
  headers: { 'X-Internxt-2FA-Code': code },
});
