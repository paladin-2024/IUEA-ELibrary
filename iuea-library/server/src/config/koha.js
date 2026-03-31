const axios = require('axios');

let kohaToken = null;
let tokenExpiry = null;

const getKohaToken = async () => {
  if (kohaToken && tokenExpiry && Date.now() < tokenExpiry) {
    return kohaToken;
  }

  const params = new URLSearchParams();
  params.append('grant_type', 'client_credentials');
  params.append('client_id',     process.env.KOHA_CLIENT_ID);
  params.append('client_secret', process.env.KOHA_CLIENT_SECRET);

  const response = await axios.post(
    `${process.env.KOHA_BASE_URL}/auth/token`,
    params,
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );

  kohaToken  = response.data.access_token;
  tokenExpiry = Date.now() + (response.data.expires_in - 60) * 1000;
  return kohaToken;
};

const kohaClient = axios.create({
  baseURL: process.env.KOHA_BASE_URL,
});

kohaClient.interceptors.request.use(async (config) => {
  const token = await getKohaToken();
  config.headers.Authorization = `Bearer ${token}`;
  return config;
});

module.exports = { kohaClient, getKohaToken };
