@echo off
echo ===================================================
echo   PINHAN BOX - FINAL DEPLOYMENT SCRIPT
echo ===================================================
echo.
echo [1/3] Adding files to Git...
git add .
echo.

echo [2/3] Committing changes...
git commit -m "Final Premium Release - Ready for Render"
echo.

echo [3/3] Pushing to GitHub...
git push origin main
echo.
echo ===================================================
echo   ROCKET CODE SENT TO GITHUB! 🚀
echo   Check your Render Dashboard to see the build.
echo ===================================================
pause
