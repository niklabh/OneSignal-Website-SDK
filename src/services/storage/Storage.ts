import Service from "../Service";
import * as LocalForage from 'localforage';
import { AppConfig } from "../../models/AppConfig";
import { Subscription } from "../../models/Subscription";
import { AppState } from "../../models/AppState";


class Storage implements Service {

    static init() {
        LocalForage.config({
            driver: (<any>LocalForage).INDEXEDDB,
            storeName: 'onesignal-web-sdk',
            version: 1.0
        });
    }

    static async getAppConfig(): Promise<AppConfig> {
        return await LocalForage.getItem('appConfig');
    }

    static async setAppConfig(appConfig: AppConfig) {
        return await (<any>LocalForage.setItem)('appConfig', appConfig);
    }

    static async getSubscription(): Promise<Subscription> {
        return await LocalForage.getItem('subscription');
    }

    static async setSubscription(subscription: Subscription) {
        return await (<any>LocalForage.setItem)('subscription', subscription);
    }

    static async getAppState(): Promise<AppState> {
        return await LocalForage.getItem('subscription');
    }

    static async setAppState(appState: AppState) {
        return await (<any>LocalForage.setItem)('appState', appState);
    }
}

export { Storage };