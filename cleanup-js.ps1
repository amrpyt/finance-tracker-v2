# Remove all .js and .js.map files from convex directory except _generated
Get-ChildItem -Path "convex" -Recurse -Include "*.js","*.js.map" | 
    Where-Object { $_.FullName -notmatch "_generated" } | 
    Remove-Item -Force -ErrorAction SilentlyContinue

Write-Host "Cleaned all .js files from convex directory (except _generated)"
