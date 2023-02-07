import { http } from 'minimesh';


export class UserService {

  constructor(private readonly _client = http) {}

  public get client() {
    return this._client;
  }

};