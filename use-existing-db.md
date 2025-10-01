# Using Your Existing Database

If you have an existing database file in a different location, here are several ways to integrate it with the new system:

## Option 1: Set Custom Database Path (Recommended)

Use the `POS_DB_PATH` environment variable to point to your existing database:

### For Development:

```bash
# Set the environment variable to your existing database
export POS_DB_PATH="/path/to/your/existing/database.db"
npm start
```

### For Production Build:

```bash
# Set the environment variable before launching
export POS_DB_PATH="/path/to/your/existing/database.db"
./dist/AuraSwift.app/Contents/MacOS/AuraSwift
```

### Permanent Configuration:

Create a `.env` file in the project root:

```bash
POS_DB_PATH="/path/to/your/existing/database.db"
```

## Option 2: Copy Database to Development Location

Copy your existing database to the development data directory:

```bash
# Create the dev-data directory if it doesn't exist
mkdir -p ./dev-data

# Copy your existing database
cp "/path/to/your/existing/database.db" "./dev-data/pos_system.db"

# Start the application normally
npm start
```

## Option 3: Copy Database to Production Location

Move your database to the production location:

### macOS:

```bash
# Create the application data directory
mkdir -p "$HOME/Library/Application Support/AuraSwift"

# Copy your existing database
cp "/path/to/your/existing/database.db" "$HOME/Library/Application Support/AuraSwift/pos_system.db"
```

### Windows:

```cmd
# Create the application data directory
mkdir "%APPDATA%\AuraSwift"

# Copy your existing database
copy "C:\path\to\your\existing\database.db" "%APPDATA%\AuraSwift\pos_system.db"
```

### Linux:

```bash
# Create the application data directory
mkdir -p "$HOME/.config/AuraSwift"

# Copy your existing database
cp "/path/to/your/existing/database.db" "$HOME/.config/AuraSwift/pos_system.db"
```

## Verify Database Integration

After setting up your database, verify it's working:

1. **Check database location in the app:**

   - The application has a database info feature accessible through the dashboard
   - It will show the current database path and basic statistics

2. **Test with the utility script:**
   ```bash
   # Test with your custom path
   POS_DB_PATH="/path/to/your/existing/database.db" node test-db-path.mjs
   ```

## Database Schema Compatibility

The application expects certain tables and columns. If your existing database has a different schema:

1. **Backup your existing database first:**

   ```bash
   cp "/path/to/your/existing/database.db" "/path/to/your/existing/database.backup.db"
   ```

2. **Run the application once** - it will automatically create missing tables and columns

3. **Check the migration logs** in the console for any schema updates

## Need Help?

- Run `npm run db:info` to see database configuration help
- Check `DATABASE_CONFIG.md` for detailed configuration options
- Use the test utility: `node test-db-path.mjs` to verify path logic
