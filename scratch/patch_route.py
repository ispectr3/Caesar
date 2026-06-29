import re
import os

file_path = "src/routeTree.gen.ts"
with open(file_path, "r") as f:
    content = f.read()

# Check if already patched
if "from './routes/report'" in content:
    print("Already patched")
    exit(0)

# Add import
content = re.sub(
    r"(import \{ Route as IndexRouteImport \} from './routes/index')",
    r"\1\nimport { Route as ReportRouteImport } from './routes/report'",
    content
)

# Add route const
content = re.sub(
    r"(const IndexRoute = IndexRouteImport.update\(\{.*?\n\} as any\))",
    r"const ReportRoute = ReportRouteImport.update({\n  id: '/report',\n  path: '/report',\n  getParentRoute: () => rootRouteImport,\n} as any)\n\1",
    content,
    flags=re.DOTALL
)

# Add to FileRoutesByFullPath
content = re.sub(
    r"('/': typeof IndexRoute)",
    r"'/report': typeof ReportRoute\n  \1",
    content
)

# Add to FileRoutesByTo
content = re.sub(
    r"('/': typeof IndexRoute)",
    r"'/report': typeof ReportRoute\n  \1",
    content
)

# Add to FileRoutesById
content = re.sub(
    r"('/': typeof IndexRoute)",
    r"'/report': typeof ReportRoute\n  \1",
    content
)

# Add to fullPaths
content = re.sub(
    r"(\| '/')",
    r"| '/report'\n    \1",
    content
)

# Add to to
content = re.sub(
    r"(\| '/')",
    r"| '/report'\n    \1",
    content
)

# Add to id
content = re.sub(
    r"(\| '/')",
    r"| '/report'\n    \1",
    content
)

# Add to RootRouteChildren
content = re.sub(
    r"(IndexRoute: typeof IndexRoute)",
    r"ReportRoute: typeof ReportRoute\n  \1",
    content
)

# Add to FileRoutesByPath
content = re.sub(
    r"(interface FileRoutesByPath \{)",
    r"\1\n    '/report': {\n      id: '/report'\n      path: '/report'\n      fullPath: '/report'\n      preLoaderRoute: typeof ReportRouteImport\n      parentRoute: typeof rootRouteImport\n    }",
    content
)

with open(file_path, "w") as f:
    f.write(content)
print("Successfully patched routeTree.gen.ts")
