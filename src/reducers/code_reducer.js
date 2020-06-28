import { DID_UPDATE_CODE } from '../actions/types';

const STORAGE_KEY = 'editor-typescript-playground';


const INITIAL_STATE = sessionStorage.getItem(STORAGE_KEY) || '';

export default function(state = INITIAL_STATE, action) {
  switch (action.type) {
  case DID_UPDATE_CODE:
    sessionStorage.setItem(STORAGE_KEY, action.payload);
    return action.payload
  default:
    return state;
  }
}
