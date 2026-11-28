import axios from 'axios';

export const mainApi = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:4000'
})