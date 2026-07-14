import * as react from 'react';
import { ReactNode } from 'react';
import { ColorOverrides } from 'circuit-to-svg';
import { BaseManualEditEvent, ManualEditEvent } from '@tscircuit/props';
import { CircuitJson } from 'circuit-json';

interface EditSchematicWireAddEvent extends BaseManualEditEvent {
    edit_event_type: "edit_schematic_wire_add";
    from_schematic_port_id: string;
    to_schematic_port_id: string;
    route: Array<{
        x: number;
        y: number;
    }>;
}
interface EditSchematicBusAddEvent extends BaseManualEditEvent {
    edit_event_type: "edit_schematic_bus_add";
    route: Array<{
        x: number;
        y: number;
    }>;
}
interface EditSchematicBusEntryAddEvent extends BaseManualEditEvent {
    edit_event_type: "edit_schematic_bus_entry_add";
    anchor: {
        x: number;
        y: number;
    };
}
interface EditSchematicNoConnectAddEvent extends BaseManualEditEvent {
    edit_event_type: "edit_schematic_no_connect_add";
    center: {
        x: number;
        y: number;
    };
    schematic_port_id?: string;
}
interface EditSchematicNetLabelAddEvent extends BaseManualEditEvent {
    edit_event_type: "edit_schematic_net_label_add";
    position: {
        x: number;
        y: number;
    };
    net_name: string;
    schematic_port_id?: string;
    anchor_side?: "left" | "right" | "top" | "bottom";
}
interface EditSchematicGlobalLabelAddEvent extends BaseManualEditEvent {
    edit_event_type: "edit_schematic_global_label_add";
    position: {
        x: number;
        y: number;
    };
    net_name: string;
    schematic_port_id?: string;
    anchor_side?: "left" | "right" | "top" | "bottom";
}
interface EditSchematicPowerPortAddEvent extends BaseManualEditEvent {
    edit_event_type: "edit_schematic_power_port_add";
    position: {
        x: number;
        y: number;
    };
    net_name: string;
    schematic_port_id?: string;
    anchor_side?: "left" | "right" | "top" | "bottom";
}
interface EditSchematicGroundPortAddEvent extends BaseManualEditEvent {
    edit_event_type: "edit_schematic_ground_port_add";
    position: {
        x: number;
        y: number;
    };
    net_name: string;
    schematic_port_id?: string;
    anchor_side?: "left" | "right" | "top" | "bottom";
}
interface EditSchematicTextNoteAddEvent extends BaseManualEditEvent {
    edit_event_type: "edit_schematic_text_note_add";
    position: {
        x: number;
        y: number;
    };
    text: string;
    anchor?: "left" | "right" | "center";
    font_size?: number;
    color?: string;
}
interface EditSchematicHierSheetAddEvent extends BaseManualEditEvent {
    edit_event_type: "edit_schematic_hier_sheet_add";
    box: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    sheet_name: string;
    target_sheet_id: string;
    sheet_name_pos: {
        x: number;
        y: number;
    };
    file_name_pos: {
        x: number;
        y: number;
    };
}
type PlacementComponentKind = "resistor" | "capacitor" | "inductor";
interface EditSchematicComponentAddEvent extends BaseManualEditEvent {
    edit_event_type: "edit_schematic_component_add";
    position: {
        x: number;
        y: number;
    };
    component_kind: PlacementComponentKind;
    rotation?: number;
}

interface HierSheetTarget {
    id: string;
    title: string;
}

interface Props$1 {
    circuitJson: CircuitJson;
    containerStyle?: React.CSSProperties;
    editEvents?: ManualEditEvent[];
    onEditEvent?: (event: ManualEditEvent) => void;
    defaultEditMode?: boolean;
    debugGrid?: boolean;
    editingEnabled?: boolean;
    debug?: boolean;
    clickToInteractEnabled?: boolean;
    colorOverrides?: ColorOverrides;
    spiceSimulationEnabled?: boolean;
    disableGroups?: boolean;
    onSchematicComponentClicked?: (options: {
        schematicComponentId: string;
        event: MouseEvent;
    }) => void;
    showSchematicPorts?: boolean;
    onSchematicPortClicked?: (options: {
        schematicPortId: string;
        event: MouseEvent;
    }) => void;
    toolMode?: "select" | "draw_wire" | "draw_bus" | "draw_bus_entry" | "draw_no_connect" | "draw_net_label" | "draw_global_label" | "draw_hier_sheet" | "draw_power_port" | "draw_ground_port" | "draw_text_note" | "draw_trace" | "draw_component";
    onWireAdded?: (event: EditSchematicWireAddEvent) => void;
    onBusAdded?: (event: EditSchematicBusAddEvent) => void;
    onBusEntryAdded?: (event: EditSchematicBusEntryAddEvent) => void;
    onNoConnectAdded?: (event: EditSchematicNoConnectAddEvent) => void;
    onNetLabelAdded?: (event: EditSchematicNetLabelAddEvent) => void;
    onGlobalLabelAdded?: (event: EditSchematicGlobalLabelAddEvent) => void;
    onHierSheetAdded?: (event: EditSchematicHierSheetAddEvent) => void;
    onPowerPortAdded?: (event: EditSchematicPowerPortAddEvent) => void;
    onGroundPortAdded?: (event: EditSchematicGroundPortAddEvent) => void;
    onTextNoteAdded?: (event: EditSchematicTextNoteAddEvent) => void;
    onComponentAdded?: (event: EditSchematicComponentAddEvent) => void;
    placementComponentKind?: PlacementComponentKind;
    hierSheetTargets?: HierSheetTarget[];
    activeSheetId?: string;
    allowComponentEdit?: boolean;
    allowCanvasPan?: boolean;
}
declare const SchematicViewer: ({ circuitJson, containerStyle, editEvents: unappliedEditEvents, onEditEvent, defaultEditMode, debugGrid, editingEnabled, debug, clickToInteractEnabled, colorOverrides, spiceSimulationEnabled, disableGroups, onSchematicComponentClicked, showSchematicPorts, onSchematicPortClicked, toolMode, onWireAdded, onBusAdded, onBusEntryAdded, onNoConnectAdded, onNetLabelAdded, onGlobalLabelAdded, onHierSheetAdded, onPowerPortAdded, onGroundPortAdded, onTextNoteAdded, onComponentAdded, placementComponentKind, hierSheetTargets, activeSheetId, allowComponentEdit, allowCanvasPan, }: Props$1) => react.JSX.Element;

interface BoundingBoxBounds {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
}
declare const MouseTracker: ({ children }: {
    children: ReactNode;
}) => react.JSX.Element;

interface UseMouseEventsOverBoundingBoxOptions {
    bounds: BoundingBoxBounds | null;
    onClick?: (event: MouseEvent) => void;
}
declare const useMouseEventsOverBoundingBox: (options: UseMouseEventsOverBoundingBoxOptions) => {
    hovering: boolean;
};

interface Props {
    circuitJson: CircuitJson;
    containerStyle?: React.CSSProperties;
    colorOverrides?: ColorOverrides;
    width?: number;
    height?: number;
    className?: string;
}
declare const AnalogSimulationViewer: ({ circuitJson: inputCircuitJson, containerStyle, colorOverrides, width, height, className, }: Props) => react.JSX.Element;

export { AnalogSimulationViewer, type EditSchematicBusAddEvent, type EditSchematicBusEntryAddEvent, type EditSchematicComponentAddEvent, type EditSchematicGlobalLabelAddEvent, type EditSchematicGroundPortAddEvent, type EditSchematicHierSheetAddEvent, type EditSchematicNetLabelAddEvent, type EditSchematicNoConnectAddEvent, type EditSchematicPowerPortAddEvent, type EditSchematicTextNoteAddEvent, type EditSchematicWireAddEvent, MouseTracker, type PlacementComponentKind, SchematicViewer, useMouseEventsOverBoundingBox };
