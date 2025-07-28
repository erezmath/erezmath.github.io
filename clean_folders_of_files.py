#!/usr/bin/env python3
"""
Script to recursively remove files with a specific name from a folder and its subfolders.
"""

import os
import sys

# =============================================================================
# CONFIGURATION - Change these values as needed
# =============================================================================

# The folder path to search recursively
FOLDER_PATH = r"I:\some_folder_name"

# The filename to remove (case-insensitive)
FILENAME_TO_REMOVE = "desktop.ini"

# =============================================================================
# SCRIPT LOGIC
# =============================================================================

def clean_files_recursively(folder_path, filename_to_remove):
    """
    Recursively search through a folder and remove files with the specified name.
    Skips hidden files and counts them.
    
    Args:
        folder_path (str): The path to the folder to search
        filename_to_remove (str): The filename to remove (case-insensitive)
    
    Returns:
        tuple: (total_files_checked, files_removed, hidden_files_count)
    """
    total_files_checked = 0
    files_removed = 0
    hidden_files_count = 0
    
    # Check if the folder exists
    if not os.path.exists(folder_path):
        print(f"Error: Folder '{folder_path}' does not exist!")
        return total_files_checked, files_removed, hidden_files_count
    
    if not os.path.isdir(folder_path):
        print(f"Error: '{folder_path}' is not a directory!")
        return total_files_checked, files_removed, hidden_files_count
    
    print(f"Starting cleanup in: {folder_path}")
    print(f"Looking for files named: {filename_to_remove}")
    print("-" * 50)
    
    try:
        # Walk through all directories and files
        for root, dirs, files in os.walk(folder_path):
            for file in files:
                file_path = os.path.join(root, file)
                
                # Check if file is hidden (Windows attribute)
                try:
                    import stat
                    file_attributes = os.stat(file_path).st_file_attributes
                    is_hidden = bool(file_attributes & stat.FILE_ATTRIBUTE_HIDDEN)
                except (AttributeError, OSError):
                    # Fallback for systems that don't support FILE_ATTRIBUTE_HIDDEN
                    is_hidden = file.startswith('.')  # Unix-style hidden files
                
                if is_hidden:
                    hidden_files_count += 1
                    continue  # Skip hidden files
                
                total_files_checked += 1
                
                # Check if the filename matches (case-insensitive)
                if file.lower() == filename_to_remove.lower():
                    try:
                        os.remove(file_path)
                        files_removed += 1
                        print(f"✓ Removed: {file_path}")
                    except PermissionError:
                        print(f"✗ Permission denied: {file_path}")
                    except FileNotFoundError:
                        print(f"✗ File not found (already removed?): {file_path}")
                    except Exception as e:
                        print(f"✗ Error removing {file_path}: {e}")
                        
    except Exception as e:
        print(f"Error during cleanup: {e}")
        return total_files_checked, files_removed, hidden_files_count
    
    return total_files_checked, files_removed, hidden_files_count

def main():
    """Main function to run the cleanup."""
    print("=" * 60)
    print("FOLDER CLEANUP SCRIPT")
    print("=" * 60)
    print(f"Target folder: {FOLDER_PATH}")
    print(f"Files to remove: {FILENAME_TO_REMOVE}")
    print()
    
    # Ask for confirmation before proceeding
    response = input("Do you want to proceed with the cleanup? (y/N): ").strip().lower()
    if response not in ['y', 'yes']:
        print("Cleanup cancelled.")
        return
    
    print()
    print("Starting cleanup...")
    print()
    
    # Perform the cleanup
    total_checked, total_removed, hidden_count = clean_files_recursively(FOLDER_PATH, FILENAME_TO_REMOVE)
    
    # Print summary
    print()
    print("-" * 50)
    print("CLEANUP SUMMARY")
    print("-" * 50)
    print(f"Total files checked: {total_checked}")
    print(f"Hidden files skipped: {hidden_count}")
    print(f"Files removed: {total_removed}")
    
    if total_removed > 0:
        print(f"✓ Successfully removed {total_removed} file(s)")
    else:
        print("No files were removed.")
    
    if hidden_count > 0:
        print(f"ℹ Skipped {hidden_count} hidden file(s)")
    
    print("=" * 60)

if __name__ == "__main__":
    main() 