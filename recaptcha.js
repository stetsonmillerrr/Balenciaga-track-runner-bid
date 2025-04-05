const axios = require('axios');

const checkRecaptcha = async (captchaResponse) => {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;
  const response = await axios.post(
    `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${captchaResponse}`
  );
  return response.data.success;
};

module.exports = { checkRecaptcha };
