var chartJsonWrapper = {
    "ChartTypes": [
        {
            "name": "AnnotationChart",
            "roles": [
                {
                    "name": "X Value",
                    "types": [
                        "date",
                        "datetime"
                    ]
                },
                {
                    "name": "Y Value",
                    "types": [
                        "number"
                    ]
                },
                {
                    "role": "annotation"
                },
                {
                    "role": "annotationText"
                }
            ]
        },
        {
            "name": "AreaChart",
            "roles": [
                {
                    "name": "X Value",
                    "types": [
                        "string",
                        "number",
                        "date",
                        "datetime",
                        "timeofday"
                    ],
                    "subrolenames": [
                        "annotation",
                        "annotationText"
                    ]
                },
                {
                    "name": "Line {1} Value",
                    "types": [
                        "number"
                    ],
                    "repeatable": true,
                    "subrolenames": [
                        "annotation",
                        "annotationText",
                        "certainty",
                        "emphasis",
                        "interval",
                        "scope",
                        "style",
                        "tooltip"
                    ]
                }
            ]
        },
        {
            "name": "BarChart",
            "roles": [
                {
                    "name": "Y Value",
                    "types": [
                        "string",
                        "number",
                        "date",
                        "datetime",
                        "timeofday"
                    ]
                },
                {
                    "name": "Line {1} Value",
                    "types": [
                        "number"
                    ],
                    "repeatable": true,
                    "subrolenames": [
                        "certainty",
                        "interval",
                        "scope",
                        "tooltip"
                    ]
                },
                {
                    "role": "style"
                }
            ]
        },
        {
            "name": "BubbleChart",
            "roles": [
                {
                    "name": "ID (name)",
                    "types": [
                        "string"
                    ]
                },
                {
                    "name": "X Coordinate",
                    "types": [
                        "number"
                    ]
                },
                {
                    "name": "Y Coordinate",
                    "types": [
                        "number"
                    ]
                },
                {
                    "name": "Color/Group",
                    "types": [
                        "string",
                        "number"
                    ],
                    "optional": true
                },
                {
                    "name": "Size",
                    "types": [
                        "number"
                    ],
                    "optional": true
                }
            ]
        },
        {
            "name": "Calendar",
            "roles": [
                {
                    "name": "Date",
                    "types": [
                        "date",
                        "datetime",
                        "timeofday"
                    ]
                },
                {
                    "name": "Value",
                    "types": [
                        "number"
                    ]
                },
                {
                    "role": "tooltip"
                }
            ]
        },
        {
            "name": "CandlestickChart",
            "roles": [
                {
                    "name": "X Value",
                    "types": [
                        "number",
                        "string",
                        "date",
                        "datetime",
                        "timeofday"
                    ]
                },
                {
                    "name": "Minimal Value",
                    "types": [
                        "number"
                    ]
                },
                {
                    "name": "Initial Value",
                    "types": [
                        "number"
                    ]
                },
                {
                    "name": "Closing Value",
                    "types": [
                        "number"
                    ]
                },
                {
                    "name": "Maximal Value",
                    "types": [
                        "number"
                    ]
                },
                {
                    "role": "tooltip"
                },
                {
                    "role": "style"
                }
            ]
        },
        {
            "name": "ColumnChart",
            "roles": [
                {
                    "name": "X Value",
                    "types": [
                        "string",
                        "number",
                        "date",
                        "datetime",
                        "timeofday"
                    ]
                },
                {
                    "name": "Bar {1} Value",
                    "types": [
                        "number"
                    ],
                    "repeatable": true,
                    "subrolenames": [
                        "certainty",
                        "interval",
                        "scope",
                        "style",
                        "tooltip"
                    ]
                }
            ]
        },
        {
            "name": "ComboChart",
            "roles": [
                {
                    "name": "X Value",
                    "types": [
                        "string",
                        "number",
                        "date",
                        "datetime",
                        "timeofday"
                    ],
                    "subrolenames": [
                        "annotation",
                        "annotationText"
                    ]
                },
                {
                    "name": "Line {1} Value",
                    "types": [
                        "number"
                    ],
                    "repeatable": true,
                    "subrolenames": [
                        "annotationText",
                        "annotation",
                        "certainty",
                        "emphasis",
                        "interval",
                        "scope",
                        "style",
                        "tooltip"
                    ]
                }
            ]
        },
        {
            "name": "PieChart",
            "roles": [
                {
                    "name": "Slice Label",
                    "types": [
                        "string"
                    ]
                },
                {
                    "name": "Slice Value",
                    "types": [
                        "number"
                    ]
                },
                {
                    "role": "tooltip"
                }
            ]
        },
        {
            "name": "Sankey",
            "roles": [
                {
                    "name": "Source",
                    "types": [
                        "string"
                    ]
                },
                {
                    "name": "Destination",
                    "types": [
                        "string"
                    ]
                },
                {
                    "name": "Value",
                    "types": [
                        "number"
                    ]
                },
                {
                    "role": "tooltip"
                },
                {
                    "role": "style"
                }
            ]
        },
        {
            "name": "ScatterChart",
            "roles": [
                {
                    "name": "X Value",
                    "types": [
                        "string",
                        "number",
                        "date",
                        "datetime",
                        "timeofday"
                    ]
                },
                {
                    "name": "Series {1} Value",
                    "types": [
                        "string",
                        "number",
                        "date",
                        "datetime",
                        "timeofday"
                    ],
                    "repeatable": true,
                    "subrolenames": [
                        "certainty",
                        "emphasis",
                        "scope",
                        "tooltip"
                    ]
                },
                {
                    "role": "style"
                }
            ]
        },
        {
            "name": "SteppedAreaChart",
            "roles": [
                {
                    "name": "X Label",
                    "types": [
                        "string"
                    ]
                },
                {
                    "name": "Bar {1} Value",
                    "types": [
                        "number"
                    ],
                    "repeatable": true,
                    "subrolenames": [
                        "certainty",
                        "interval",
                        "scope",
                        "style",
                        "tooltip"
                    ]
                }
            ]
        },
        {
            "name": "Timeline",
            "roles": [
                {
                    "name": "Row Label",
                    "types": [
                        "string"
                    ]
                },
                {
                    "name": "Bar Label",
                    "types": [
                        "string"
                    ]
                },
                {
                    "role": "tooltip"
                },
                {
                    "name": "Start",
                    "subrolenames": [
                        "number",
                        "date"
                    ]
                },
                {
                    "name": "End",
                    "subrolenames": [
                        "number",
                        "date"
                    ]
                }
            ]
        },
        {
            "name": "TreeMap",
            "roles": [
                {
                    "name": "ID (name)",
                    "subrolenames": [
                        "string"
                    ]
                },
                {
                    "name": "Parent ID (name)",
                    "subrolenames": [
                        "string"
                    ]
                },
                {
                    "name": "Size",
                    "subrolenames": [
                        "number"
                    ]
                },
                {
                    "name": "Color",
                    "subrolenames": [
                        "number"
                    ],
                    "optional": true
                }
            ]
        },
        {
            "name": "WordTree",
            "roles": [
                {
                    "name": "Text",
                    "types": [
                        "string"
                    ]
                },
                {
                    "name": "Size",
                    "types": [
                        "number"
                    ],
                    "optional": true
                },
                {
                    "name": "Style",
                    "types": [
                        "string"
                    ]
                },
                {
                    "name": "ID",
                    "types": [
                        "number"
                    ],
                    "optional": true
                },
                {
                    "name": "Parent ID",
                    "types": [
                        "number"
                    ],
                    "optional": true
                }
            ]
        }
    ],
    "RoleDetails": [
        {
            "name": "annotation",
            "caption": "Annotation",
            "types": [
                "string"
            ],
            "default": ""
        },
        {
            "name": "annotationText",
            "caption": "Annotation Text",
            "types": [
                "string"
            ],
            "default": ""
        },
        {
            "name": "certainty",
            "caption": "Certainty",
            "types": [
                "boolean"
            ],
            "default": true
        },
        {
            "name": "emphasis",
            "caption": "Emphasis",
            "types": [
                "boolean"
            ],
            "default": false
        },
        {
            "name": "interval",
            "caption": "Interval",
            "types": [
                "number"
            ],
            "default": null
        },
        {
            "name": "scope",
            "caption": "Scope",
            "types": [
                "boolean"
            ],
            "default": true
        },
        {
            "name": "style",
            "caption": "Style",
            "types": [
                "object"
            ],
            "default": null
        },
        {
            "name": "tooltip",
            "caption": "Tooltip",
            "types": [
                "string"
            ],
            "default": null
        },
        {
            "name": "domain",
            "caption": "Domain",
            "types": [
                "string",
                "date",
                "number"
            ]
        }
    ]
}