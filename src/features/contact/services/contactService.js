import { submitContactMessage } from '@/api/contactApi';

export const sendContactMessage = submitContactMessage;

export const contactService = {
  sendContactMessage,
};

export default contactService;
