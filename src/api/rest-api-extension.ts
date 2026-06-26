import SRPlugin from "src/main";
import { APIManager } from "src/api/api-manager";

export class SRRestAPIExtension {
  private plugin: SRPlugin;
  private apiManager: APIManager;
  private restApi: any = null;

  constructor(plugin: SRPlugin, apiManager: APIManager) {
    this.plugin = plugin;
    this.apiManager = apiManager;
  }

  private getRestAPI(): any {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
      const { getAPI } = require("obsidian-local-rest-api");
      return getAPI(this.plugin.app, this.plugin.manifest);
    } catch (error) {
      console.warn("SRRestAPIExtension: Local REST API plugin not available", error);
      return null;
    }
  }

  public registerRoutes() {
    try {
      this.restApi = this.getRestAPI();
      if (!this.restApi) return;

      // GET current SR review state
      this.restApi.addRoute("/spaced-repetition/state").get((_request: any, response: any) => {
        const state = this.apiManager.getState();
        response.status(200).json(state);
      });

      // GET current card details
      this.restApi
        .addRoute("/spaced-repetition/current-card")
        .get((_request: any, response: any) => {
          const state = this.apiManager.getState();
          if (state.currentCard) {
            response.status(200).json(state.currentCard);
          } else {
            response.status(204).json({ message: "No card in review" });
          }
        });

      // GET session progress
      this.restApi
        .addRoute("/spaced-repetition/progress")
        .get((_request: any, response: any) => {
          const state = this.apiManager.getState();
          if (state.sessionProgress) {
            response.status(200).json(state.sessionProgress);
          } else {
            response.status(204).json({ message: "No active session" });
          }
        });

      // GET is reviewing status
      this.restApi
        .addRoute("/spaced-repetition/is-reviewing")
        .get((_request: any, response: any) => {
          const state = this.apiManager.getState();
          response.status(200).json({ isReviewing: state.isReviewing });
        });

      console.log("Spaced Repetition REST API routes registered");
    } catch (error) {
      console.warn("SRRestAPIExtension: Error registering routes", error);
    }
  }

  public unregister() {
    if (this.restApi) {
      try {
        this.restApi.unregister();
        console.log("Spaced Repetition REST API routes unregistered");
      } catch (error) {
        console.warn("SRRestAPIExtension: Error unregistering routes", error);
      }
    }
  }
}
