import { Storage } from './services/storage/Storage';
import {AppState} from "./models/AppState";

Storage.init();
new AppState();