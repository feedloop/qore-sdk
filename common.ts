import Axios from 'axios';
import dotenv from 'dotenv';
dotenv.config()
const API_URL = process.env.API_URL
export async function callApi(params: { method: "get" | "post" | "put" | "delete" | "patch", url: string, data?: { [key: string]: any }, params?: { [key: string]: any } }, token?: string) {
    const headers = {}
    if (token) {
        headers['Authorization'] = token
    }
    try {
        return (await Axios({ ...params, headers, url: API_URL + params.url })).data
    } catch (error) {
        const data = error.response.data
        if (data && data.error) throw new Error(typeof data.error === "string" ? data.error : JSON.stringify(data.error))
        throw new Error('Cannot get response from server')
    }
}