/*
  Reset operational data for ClubReport Hub while preserving login data.

  This script does not touch ClubReportHub_Auth. It clears the business
  databases so each teammate can start with the same clean workspace and keep
  the seeded login accounts.

  PowerShell:
    Get-Content .\docs\reset-operational-data.sql | docker exec -i clubreport-sqlserver /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "ClubReportHub!2026" -C -b
*/

SET NOCOUNT ON;
SET ANSI_NULLS ON;
SET ANSI_PADDING ON;
SET ANSI_WARNINGS ON;
SET ARITHABORT ON;
SET CONCAT_NULL_YIELDS_NULL ON;
SET QUOTED_IDENTIFIER ON;
SET NUMERIC_ROUNDABORT OFF;

DECLARE @Databases TABLE (Name sysname NOT NULL);

INSERT INTO @Databases (Name)
VALUES
    (N'ClubReportHub_Club'),
    (N'ClubReportHub_Activity'),
    (N'ClubReportHub_Report'),
    (N'ClubReportHub_Finance'),
    (N'ClubReportHub_Export'),
    (N'ClubReportHub_Notification');

DECLARE @DatabaseName sysname;
DECLARE @Sql nvarchar(max);

DECLARE database_cursor CURSOR LOCAL FAST_FORWARD FOR
SELECT Name FROM @Databases;

OPEN database_cursor;
FETCH NEXT FROM database_cursor INTO @DatabaseName;

WHILE @@FETCH_STATUS = 0
BEGIN
    IF DB_ID(@DatabaseName) IS NULL
    BEGIN
        PRINT CONCAT('Skip missing database: ', @DatabaseName);
    END
    ELSE
    BEGIN
        SET @Sql = N'
USE ' + QUOTENAME(@DatabaseName) + N';
SET ANSI_NULLS ON;
SET ANSI_PADDING ON;
SET ANSI_WARNINGS ON;
SET ARITHABORT ON;
SET CONCAT_NULL_YIELDS_NULL ON;
SET QUOTED_IDENTIFIER ON;
SET NUMERIC_ROUNDABORT OFF;

DECLARE @Command nvarchar(max) = N'''';

IF SCHEMA_ID(N''HangFire'') IS NOT NULL
BEGIN
    SELECT @Command = @Command + N''ALTER TABLE ''
        + QUOTENAME(OBJECT_SCHEMA_NAME(parent_object_id)) + N''.'' + QUOTENAME(OBJECT_NAME(parent_object_id))
        + N'' DROP CONSTRAINT '' + QUOTENAME(name) + N'';'' + CHAR(13)
    FROM sys.foreign_keys
    WHERE OBJECT_SCHEMA_NAME(parent_object_id) = N''HangFire''
       OR OBJECT_SCHEMA_NAME(referenced_object_id) = N''HangFire'';

    IF @Command <> N''''
    BEGIN
        EXEC sp_executesql @Command;
    END;

    SET @Command = N'''';

    SELECT @Command = @Command + N''DROP TABLE ''
        + QUOTENAME(SCHEMA_NAME(schema_id)) + N''.'' + QUOTENAME(name)
        + N'';'' + CHAR(13)
    FROM sys.tables
    WHERE SCHEMA_NAME(schema_id) = N''HangFire'';

    IF @Command <> N''''
    BEGIN
        EXEC sp_executesql @Command;
    END;

    IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE schema_id = SCHEMA_ID(N''HangFire''))
    BEGIN
        DROP SCHEMA [HangFire];
    END;
END;

SET @Command = N'''';

SELECT @Command = @Command + N''ALTER TABLE ''
    + QUOTENAME(SCHEMA_NAME(schema_id)) + N''.'' + QUOTENAME(name)
    + N'' NOCHECK CONSTRAINT ALL;'' + CHAR(13)
FROM sys.tables
WHERE name <> N''__EFMigrationsHistory''
  AND SCHEMA_NAME(schema_id) <> N''HangFire'';

IF @Command <> N''''
BEGIN
    EXEC sp_executesql @Command;
END;

SET @Command = N'''';

SELECT @Command = @Command + N''DELETE FROM ''
    + QUOTENAME(SCHEMA_NAME(schema_id)) + N''.'' + QUOTENAME(name)
    + N'';'' + CHAR(13)
FROM sys.tables
WHERE name <> N''__EFMigrationsHistory''
  AND SCHEMA_NAME(schema_id) <> N''HangFire'';

IF @Command <> N''''
BEGIN
    EXEC sp_executesql @Command;
END;

SET @Command = N'''';

SELECT @Command = @Command + N''ALTER TABLE ''
    + QUOTENAME(SCHEMA_NAME(schema_id)) + N''.'' + QUOTENAME(name)
    + N'' WITH CHECK CHECK CONSTRAINT ALL;'' + CHAR(13)
FROM sys.tables
WHERE name <> N''__EFMigrationsHistory''
  AND SCHEMA_NAME(schema_id) <> N''HangFire'';

IF @Command <> N''''
BEGIN
    EXEC sp_executesql @Command;
END;
';

        EXEC sp_executesql @Sql;
        PRINT CONCAT('Cleared operational database: ', @DatabaseName);
    END;

    FETCH NEXT FROM database_cursor INTO @DatabaseName;
END;

CLOSE database_cursor;
DEALLOCATE database_cursor;

PRINT 'Operational data reset finished. ClubReportHub_Auth was preserved.';
