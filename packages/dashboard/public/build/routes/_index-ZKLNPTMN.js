import {
  useLoaderData
} from "/build/_shared/chunk-SNL74AMN.js";
import {
  require_jsx_dev_runtime
} from "/build/_shared/chunk-GIWQE7M7.js";
import "/build/_shared/chunk-ZZMTOM2W.js";
import "/build/_shared/chunk-YGBV2234.js";
import {
  createHotContext
} from "/build/_shared/chunk-6KJUCXWV.js";
import "/build/_shared/chunk-QXLBBUDB.js";
import {
  __commonJS,
  __toESM
} from "/build/_shared/chunk-PNG5AS42.js";

// empty-module:@remix-run/node
var require_node = __commonJS({
  "empty-module:@remix-run/node"(exports, module) {
    module.exports = {};
  }
});

// app/routes/_index.tsx
var import_node = __toESM(require_node(), 1);
var import_jsx_dev_runtime = __toESM(require_jsx_dev_runtime(), 1);
if (!window.$RefreshReg$ || !window.$RefreshSig$ || !window.$RefreshRuntime$) {
  console.warn("remix:hmr: React Fast Refresh only works when the Remix compiler is running in development mode.");
} else {
  prevRefreshReg = window.$RefreshReg$;
  prevRefreshSig = window.$RefreshSig$;
  window.$RefreshReg$ = (type, id) => {
    window.$RefreshRuntime$.register(type, '"app/routes/_index.tsx"' + id);
  };
  window.$RefreshSig$ = window.$RefreshRuntime$.createSignatureFunctionForTransform;
}
var prevRefreshReg;
var prevRefreshSig;
var _s = $RefreshSig$();
if (import.meta) {
  import.meta.hot = createHotContext(
    //@ts-expect-error
    "app/routes/_index.tsx"
  );
  import.meta.hot.lastModified = "1746202123326.0906";
}
var meta = () => {
  return [{
    title: "New Remix App"
  }, {
    name: "description",
    content: "Welcome to Remix!"
  }];
};
function App() {
  _s();
  const {
    peerId,
    workers
  } = useLoaderData();
  return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6", children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { className: "bg-white rounded-lg shadow p-6", children: [
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("h2", { className: "text-xl font-semibold mb-4", children: [
      "Connected Workers (",
      workers.length,
      ")"
    ] }, void 0, true, {
      fileName: "app/routes/_index.tsx",
      lineNumber: 49,
      columnNumber: 9
    }, this),
    workers.length > 0 ? /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("ul", { className: "divide-y divide-gray-200", children: workers.map((worker) => /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("li", { className: "py-3 flex justify-between items-center", children: [
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("p", { className: "font-medium", children: worker.id }, void 0, false, {
          fileName: "app/routes/_index.tsx",
          lineNumber: 55,
          columnNumber: 19
        }, this),
        /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("p", { className: "text-sm text-gray-500", children: worker.address }, void 0, false, {
          fileName: "app/routes/_index.tsx",
          lineNumber: 56,
          columnNumber: 19
        }, this)
      ] }, void 0, true, {
        fileName: "app/routes/_index.tsx",
        lineNumber: 54,
        columnNumber: 17
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("button", { onClick: () => banPeer(worker.id), className: "px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm", children: "Ban" }, void 0, false, {
        fileName: "app/routes/_index.tsx",
        lineNumber: 58,
        columnNumber: 17
      }, this)
    ] }, worker.id, true, {
      fileName: "app/routes/_index.tsx",
      lineNumber: 53,
      columnNumber: 36
    }, this)) }, void 0, false, {
      fileName: "app/routes/_index.tsx",
      lineNumber: 52,
      columnNumber: 31
    }, this) : /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("p", { className: "text-gray-500", children: "No workers connected" }, void 0, false, {
      fileName: "app/routes/_index.tsx",
      lineNumber: 62,
      columnNumber: 19
    }, this)
  ] }, void 0, true, {
    fileName: "app/routes/_index.tsx",
    lineNumber: 48,
    columnNumber: 7
  }, this) }, void 0, false, {
    fileName: "app/routes/_index.tsx",
    lineNumber: 46,
    columnNumber: 10
  }, this);
}
_s(App, "GWZRN+LGKcqgQt46xBRgekWZ2sU=", false, function() {
  return [useLoaderData];
});
_c = App;
var _c;
$RefreshReg$(_c, "App");
window.$RefreshReg$ = prevRefreshReg;
window.$RefreshSig$ = prevRefreshSig;
export {
  App as default,
  meta
};
//# sourceMappingURL=/build/routes/_index-ZKLNPTMN.js.map
