(window.webpackJsonp=window.webpackJsonp||[]).push([[8],{3021:function(module,exports){module.exports=function(hljs){var IDENT_RE="[A-Za-z_][0-9A-Za-z_]*",KEYWORDS={keyword:"if for while var new function do return void else break",literal:"true false null undefined NaN Infinity PI BackSlash DoubleQuote ForwardSlash NewLine SingleQuote Tab",built_in:"Abs Acos Area AreaGeodetic Asin Atan Atan2 Average Boolean Buffer BufferGeodetic Ceil Centroid Clip Console Constrain Contains Cos Count Crosses Cut Date DateAdd DateDiff Day Decode DefaultValue Dictionary Difference Disjoint Distance Distinct DomainCode DomainName Equals Exp Extent Feature FeatureSet FeatureSetById FeatureSetByTitle FeatureSetByUrl Filter First Floor Geometry Guid HasKey Hour IIf IndexOf Intersection Intersects IsEmpty Length LengthGeodetic Log Max Mean Millisecond Min Minute Month MultiPartToSinglePart Multipoint NextSequenceValue Now Number OrderBy Overlaps Point Polygon Polyline Pow Random Relate Reverse Round Second SetGeometry Sin Sort Sqrt Stdev Sum SymmetricDifference Tan Text Timestamp Today ToLocal Top Touches ToUTC TypeOf Union Variance Weekday When Within Year "},NUMBER={className:"number",variants:[{begin:"\\b(0[bB][01]+)"},{begin:"\\b(0[oO][0-7]+)"},{begin:hljs.C_NUMBER_RE}],relevance:0},SUBST={className:"subst",begin:"\\$\\{",end:"\\}",keywords:KEYWORDS,contains:[]},TEMPLATE_STRING={className:"string",begin:"`",end:"`",contains:[hljs.BACKSLASH_ESCAPE,SUBST]};SUBST.contains=[hljs.APOS_STRING_MODE,hljs.QUOTE_STRING_MODE,TEMPLATE_STRING,NUMBER,hljs.REGEXP_MODE];var PARAMS_CONTAINS=SUBST.contains.concat([hljs.C_BLOCK_COMMENT_MODE,hljs.C_LINE_COMMENT_MODE]);return{aliases:["arcade"],keywords:KEYWORDS,contains:[hljs.APOS_STRING_MODE,hljs.QUOTE_STRING_MODE,TEMPLATE_STRING,hljs.C_LINE_COMMENT_MODE,hljs.C_BLOCK_COMMENT_MODE,{className:"symbol",begin:"\\$[feature|layer|map|value|view]+"},NUMBER,{begin:/[{,]\s*/,relevance:0,contains:[{begin:IDENT_RE+"\\s*:",returnBegin:!0,relevance:0,contains:[{className:"attr",begin:IDENT_RE,relevance:0}]}]},{begin:"("+hljs.RE_STARTERS_RE+"|\\b(return)\\b)\\s*",keywords:"return",contains:[hljs.C_LINE_COMMENT_MODE,hljs.C_BLOCK_COMMENT_MODE,hljs.REGEXP_MODE,{className:"function",begin:"(\\(.*?\\)|"+IDENT_RE+")\\s*=>",returnBegin:!0,end:"\\s*=>",contains:[{className:"params",variants:[{begin:IDENT_RE},{begin:/\(\s*\)/},{begin:/\(/,end:/\)/,excludeBegin:!0,excludeEnd:!0,keywords:KEYWORDS,contains:PARAMS_CONTAINS}]}]}],relevance:0},{className:"function",beginKeywords:"function",end:/\{/,excludeEnd:!0,contains:[hljs.inherit(hljs.TITLE_MODE,{begin:IDENT_RE}),{className:"params",begin:/\(/,end:/\)/,excludeBegin:!0,excludeEnd:!0,contains:PARAMS_CONTAINS}],illegal:/\[|%/},{begin:/\$[(.]/}],illegal:/#(?!!)/}}}}]);
//# sourceMappingURL=react-syntax-highlighter_languages_highlight_arcade.b7a07fb3dc48faaa754e.bundle.js.map