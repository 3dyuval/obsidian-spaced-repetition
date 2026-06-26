import { EventRef } from "obsidian";
import SRPlugin from "src/main";
import { RepItemState, ReviewResponse } from "src/scheduling/algorithms/base/repetition-item";

export interface CurrentCardState {
  front: string;
  back: string;
  file: string;
  position: number | null;
  reviewMode: string;
}

export interface SessionProgress {
  completed: number;
  total: number;
  currentDifficulty: string | null;
}

export interface APIState {
  currentCard: CurrentCardState | null;
  sessionProgress: SessionProgress | null;
  isReviewing: boolean;
  uiState: string;
}

export class APIManager {
  private plugin: SRPlugin;
  private state: APIState = {
    currentCard: null,
    sessionProgress: null,
    isReviewing: false,
    uiState: "Closed",
  };

  private stateChangeCallbacks: Array<(state: APIState) => void> = [];
  private eventRefs: EventRef[] = [];

  constructor(plugin: SRPlugin) {
    this.plugin = plugin;
    this.registerListeners();
  }

  private registerListeners() {
    // Listen to workspace events that might indicate card state changes
    this.eventRefs.push(
      this.plugin.app.workspace.on("active-leaf-change", () => {
        this.updateState();
      })
    );
  }

  private updateState() {
    const uiManager = this.plugin.uiManager;
    const contentManager = uiManager.contentManager;

    // Update UI state
    this.state.uiState = uiManager.uiState.toString();
    this.state.isReviewing = uiManager.isSRInFocus;

    // Try to extract current card info from content manager if available
    if (contentManager) {
      try {
        // TODO: Access ContentManager's internal state to extract card data
        // This requires understanding the ContentManager's structure
        // For now, return null until ContentManager is extended with public accessors
        this.state.currentCard = null;
        this.state.sessionProgress = null;
      } catch (error) {
        console.warn("APIManager: Error updating card state", error);
      }
    }

    // Notify listeners of state change
    this.notifyStateChange();
  }

  private notifyStateChange() {
    this.stateChangeCallbacks.forEach((callback) => {
      try {
        callback(this.state);
      } catch (error) {
        console.warn("APIManager: Error in state change callback", error);
      }
    });
  }

  public getState(): APIState {
    this.updateState();
    return { ...this.state };
  }

  public onStateChange(callback: (state: APIState) => void): () => void {
    this.stateChangeCallbacks.push(callback);
    return () => {
      this.stateChangeCallbacks = this.stateChangeCallbacks.filter((cb) => cb !== callback);
    };
  }

  public destroy() {
    this.eventRefs.forEach((ref) => this.plugin.app.workspace.offref(ref));
    this.stateChangeCallbacks = [];
  }
}
