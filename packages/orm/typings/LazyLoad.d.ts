import type { FxOrmInstance } from "./Typo/instance";
import type { FxOrmModel } from "./Typo/model";
import type { FxOrmProperty } from "./Typo/property";
export declare function extend(Instance: FxOrmInstance.Instance, Model: FxOrmModel.Model, properties: Record<string, FxOrmProperty.NormalizedProperty>): void;
