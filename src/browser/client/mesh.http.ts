import axios, { AxiosInstance, AxiosRequestConfig, AxiosStatic } from "axios";
import type { ViewContext } from "../../types/face.context";
import { statusCodes } from "../common/http.status.codes";

/**
 * Interface for the base MiniMesh http client that is exposed to client and server instances.
 * @interface MeshHttpClient
 * @extends {AxiosStatic}
 * @author Zach Ayers
 */
type MeshHttpClient = AxiosStatic & {
  useApi: (context: ViewContext, opts?: AxiosRequestConfig) => AxiosInstance;
  statusCodes: typeof statusCodes;
};

/**
 * Base MiniMesh http client implementation that is exposed to client and server instances.
 * @type {MeshHttpClient}
 * @author Zach Ayers
 */
export const http: MeshHttpClient = axios as MeshHttpClient;

/**
 * USE API Hook - usable outside a MiniMesh View to scope an API to the current server.
 * @param {ViewContext} context - The current view context.
 * @param {AxiosRequestConfig} opts - The options to use for the request.
 * @return {AxiosInstance} - The axios instance to use for the request.
 */
http.useApi = (context: ViewContext, opts?: AxiosRequestConfig) =>
  axios.create({
    baseURL: context.serverUrl.split("/").slice(0, -3).join("/"),
    withCredentials: true,
    ...opts,
  });

/**
 * Status Codes Interface - The status codes that are available to use when reporting HTTP codes.
 * @type {typeof statusCodes} - The status codes that are available to use when reporting HTTP codes.
 * @author Zach Ayers
 */
http.statusCodes = statusCodes;
