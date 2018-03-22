del dist.zip
cd ..
call ng build --env=prod
cd buildscripts
copy config.php ..\dist\api\config.php
c:\7zip\7z.exe a -tzip dist.zip ..\dist\*