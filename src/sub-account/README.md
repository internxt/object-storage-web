# Sub-Account Console — Acceptance Criteria

## Feature: Authentication 

### Login 
#### Scenario: Successful login with valid credentials
  Given the user is on the login page
  When the user enters a valid email and password
  And the user submits the form
  Then the user is redirected to the Buckets page

#### Scenario: Login with invalid credentials
  Given the user is on the login page
  When the user enters credentials that do not match any account
  And the user submits the form
  Then an error message is shown
  And the user stays on the login page

#### Scenario: Login with empty fields
  Given the user is on the login page
  When the email or password field is empty
  Then the submit button is disabled
  And the form cannot be submitted

#### Scenario: Login request in progress
  Given the user is on the login page
  And the login request is in progress
  When the user views the submit button
  Then the submit button shows a loading indicator
  And the submit button is disabled

#### Scenario: Toggle password visibility
  Given the user is on the login page
  When the user clicks the password visibility toggle
  Then the password field switches between hidden and visible text

### Session
#### Scenario: Redirect to Buckets with active session
  Given the user has an active session
  When the user opens the app
  Then the user is redirected to the Buckets page

#### Scenario: Redirect to login with expired or missing session
  Given the session has expired or does not exist
  When the user opens the app
  Then the user is redirected to the login page

#### Scenario: Logout
  Given the user has an active session
  When the user opens the user menu
  And the user clicks Log out
  Then the session is destroyed
  And the user is redirected to the login page


## Feature: Buckets section

### Viewing the bucket list
#### Scenario: View list of buckets
  Given the user is on the Buckets page
  Then they see a list of buckets with name, region, visibility (Public/Private) and creation date

#### Scenario: Paginate bucket list
  Given there are more buckets than fit on one page
  When the user navigates to a different page
  Then the list updates to show the buckets for that page

#### Scenario: First page pagination arrow is disabled
  Given the user is on the first page
  When the user views the pagination controls
  Then the previous page arrow is disabled

#### Scenario: Last page pagination arrow is disabled
  Given the user is on the last page
  When the user views the pagination controls
  Then the next page arrow is disabled

#### Scenario: Buckets page is loading
  Given the Buckets page is loading
  When the user views the page
  Then a loading state is shown in place of the table

#### Scenario: No buckets exist
  Given there are no buckets
  When the user is on the Buckets page
  Then an empty state is shown

### Searching buckets
#### Scenario: Filter buckets by search term
  Given the user is on the Buckets page
  When the user types in the search field
  Then the list filters in real time to show only buckets whose name matches the search term

#### Scenario: No buckets match the search term
  Given the user is on the Buckets page
  When the user types a search term that matches no buckets
  Then an empty state is shown

#### Scenario: Clear search term
  Given the user has typed a search term
  When the user clicks the clear button
  Then the search field is cleared
  And the full bucket list is restored

### Opening a bucket
#### Scenario: Navigate to bucket detail
  Given the user is on the Buckets page
  When the user clicks on a bucket name
  Then they are navigated to that bucket's detail page

### Creating a bucket (admin only)
#### Scenario: Create Bucket button is visible for admins
  Given the user is an admin
  When the user is on the Buckets page
  Then the Create Bucket button is visible

#### Scenario: Create Bucket button is not visible for non-admins
  Given the user is not an admin
  When the user is on the Buckets page
  Then the Create Bucket button is not visible

#### Scenario: Successfully create a bucket
  Given the user is an admin and on the Buckets page
  When the user clicks Create Bucket and fills in a valid name and region
  And the user submits the form
  Then the bucket is created and appears in the list

#### Scenario: Create bucket with invalid name
  Given the user is on the Create Bucket form
  When the user enters a name that does not follow S3 naming rules (3–63 characters, lowercase letters, numbers and hyphens only,
  must start and end with a letter or number, no consecutive hyphens)
  Then an error is shown
  And the form cannot be submitted

#### Scenario: Create bucket request in progress 
  Given the create bucket request is in progress
  When the user views the submit button
  Then the submit button shows a loading indicator
  And the submit button is disabled

### Deleting a bucket (admin only)
#### Scenario: Context menu is visible for admins
  Given the user is an admin
  When the user is on the Buckets page
  Then a context menu with a Delete option is visible on each bucket row

#### Scenario: Context menu is not visible for non-admins
  Given the user is not an admin
  When the user is on the Buckets page
  Then the context menu is not visible

#### Scenario: Delete option shows confirmation dialog
  Given the user is an admin and on the Buckets page
  When the user selects Delete from the context menu
  Then a confirmation dialog is shown

#### Scenario: Confirm bucket deletion
  Given the confirmation dialog is shown
  When the user confirms deletion
  Then the bucket is removed from the list
  
#### Scenario: Cancel bucket deletion
  Given the confirmation dialog is shown
  When the user cancels
  Then the bucket remains in the list

## Feature: Bucket detail - Objects

### Viewing objects

#### Scenario: View list of objects
  Given the user is on the bucket detail page
  Then they see a list of objects with name, size and last modified date

#### Scenario: Objects page is loading
  Given the objects list is loading
  When the user views the page
  Then a loading state is shown in place of the table

#### Scenario: No objects exist
  Given there are no objects in the bucket
  When the user is on the bucket detail page
  Then an empty state is shown

#### Scenario: Breadcrumb navigation is shown
  Given the user is on the bucket detail page
  When the user views the page
  Then a breadcrumb showing Buckets > bucket name is displayed

#### Scenario: Navigate back to Buckets via breadcrumb
  Given the user is on the bucket detail page
  When the user clicks Buckets in the breadcrumb
  Then they are navigated back to the Buckets page

### Searching objects

#### Scenario: Filter objects by prefix
  Given the user is on the bucket detail page
  When the user types a prefix in the search field
  Then the list filters to show only objects whose name starts with that prefix

#### Scenario: No objects match the prefix
  Given the user is on the bucket detail page
  When the user types a prefix that matches no objects
  Then an empty state is shown

#### Scenario: Clear prefix search
  Given the user has typed a prefix in the search field
  When the user clicks the clear button
  Then the search field is cleared
  And the full object list is restored

### Show Versions

#### Scenario: Show Versions toggle is visible when versioning is enabled
  Given the bucket has versioning enabled
  When the user is on the bucket detail page
  Then the Show Versions toggle is visible

#### Scenario: Show Version ID column
  Given the bucket has versioning enabled
  When the user enables the Show Versions toggle
  Then a Version ID column is shown for each object
  And folders show N/A as their Version ID

#### Scenario: Hide Version ID column
  Given the Show Versions toggle is enabled
  When the user disables the toggle
  Then the Version ID column is hidden

### Selecting objects

#### Scenario: Select individual objects
  Given the user is on the bucket detail page
  When the user checks one or more object checkboxes
  Then those objects are marked as selected
  And the Delete Selected button becomes active

#### Scenario: Select all objects
  Given the user is on the bucket detail page
  When the user checks the header checkbox
  Then all _visible_ objects in the list are selected

#### Scenario: Delete Selected is disabled when a folder is selected
  Given the user has selected a folder
  When the user views the Delete Selected button
  Then the Delete Selected button is disabled

### Deleting selected objects

#### Scenario: Delete selected objects
  Given the user has one or more objects selected
  When the user clicks Delete Selected
  Then a confirmation dialog is shown

#### Scenario: Confirm deletion of selected objects
  Given the confirmation dialog is shown
  When the user confirms deletion
  Then the selected objects are removed from the list

#### Scenario: Cancel deletion of selected objects
  Given the confirmation dialog is shown
  When the user cancels
  Then the objects remain in the list

### Upload Files

#### Scenario: Upload Files button is visible for users with write permissions
  Given the user has write permissions on the bucket
  When the user is on the bucket detail page
  Then the Upload Files button is visible

#### Scenario: Upload Files button is not visible for users without write permissions
  Given the user does not have write permissions on the bucket
  When the user is on the bucket detail page
  Then the Upload Files button is not visible

#### Scenario: Open Upload Files dialog
  Given the user has write permissions on the bucket
  When the user clicks Upload Files
  Then a dialog is shown with a drag and drop area and a Browse Files button

#### Scenario: Upload files via Browse Files
  Given the Upload Files dialog is open
  When the user clicks Browse Files and selects one or more files
  Then the files are uploaded to the bucket
  And they appear in the object list

#### Scenario: Upload files via drag and drop
  Given the Upload Files dialog is open
  When the user drags and drops files or folders into the drop area
  Then the files are uploaded to the bucket
  And they appear in the object list

#### Scenario: Close Upload Files dialog
  Given the Upload Files dialog is open
  When the user clicks the X button
  Then the dialog is closed

### Create Folder

#### Scenario: Create Folder button is visible for users with write permissions
  Given the user has write permissions on the bucket
  When the user is on the bucket detail page
  Then the Create Folder button is visible

#### Scenario: Create Folder button is not visible for users without write permissions
  Given the user does not have write permissions on the bucket
  When the user is on the bucket detail page
  Then the Create Folder button is not visible

#### Scenario: Open Create Folder dialog
  Given the user has write permissions on the bucket
  When the user clicks Create Folder
  Then a dialog is shown with a Folder Name field and Cancel and Create buttons

#### Scenario: Successfully create a folder
  Given the Create Folder dialog is open
  When the user enters a valid folder name and clicks Create
  Then the folder is created and appears in the object list

#### Scenario: Create button is disabled when folder name is empty
  Given the Create Folder dialog is open
  When the folder name field is empty
  Then the Create button is disabled

#### Scenario: Cancel folder creation
  Given the Create Folder dialog is open
  When the user clicks Cancel or the X button
  Then the dialog is closed and no folder is created

### Pagination

#### Scenario: Paginate object list
  Given there are more objects than fit on one page
  When the user navigates to a different page
  Then the list updates to show the objects for that page

#### Scenario: First page pagination arrow is disabled
  Given the user is on the first page
  When the user views the pagination controls
  Then the previous page arrow is disabled

#### Scenario: Last page pagination arrow is disabled
  Given the user is on the last page
  When the user views the pagination controls
  Then the next page arrow is disabled
  

## Usage

### Viewing usage stats
- When the user navigates to the Usage page,
  then they see the latest day's summary: active storage, deleted storage, and active object count.
- When the page is loading,
  then a loading state is shown in place of the stats and table.

### Viewing daily records
- When the page loads,
  then a table shows daily usage records for the last 30 days by default,
  with columns: date, active storage, deleted storage, and active objects.
- When there are no records for the selected range,
  then an empty state is shown.

### Filtering by date range
- When the user sets a From date,
  then all dates before it are disabled in the To date picker.
- When the user sets a From and To date and applies the filter,
  then the table updates to show only records within that range.

### Sorting records
- When the user clicks the date column header,
  then the records are sorted in ascending order by date.
- When the user clicks it again,
  then the records are sorted in descending order.

### Exporting as CSV
- When the user clicks Export CSV,
  then a CSV file is downloaded containing all records currently shown in the table,
  with a header row and one row per day.

## Bucket Detail

### Viewing bucket contents
- When the user opens a bucket,
  then they see a list of objects and folders with their name, size, and last modified date.
- When the page is loading,
  then a loading state is shown in place of the list.
- When the bucket is empty,
  then an empty state is shown.

### Navigating folders
- When the user clicks on a folder,
  then the list updates to show the contents of that folder.
- When the user clicks a segment in the breadcrumb,
  then they are navigated back to that level.

### Searching objects
- When the user types in the search field,
  then the list filters in real time to show only objects whose name contains the search term.
- When no objects match the search term,
  then an empty state is shown.

### Uploading files
- When the user clicks Upload and selects one or more files,
  then the files are uploaded to the current folder.
- When the upload is in progress,
  then a loading indicator is shown.
- When the upload fails,
  then an error message is shown.

### Creating a folder
- When the user clicks Create Folder, enters a name, and confirms,
  then the folder appears in the current directory.
- When the folder name is empty,
  then the confirm button is disabled.

### Downloading a file
- When the user clicks Download on a file,
  then the file is downloaded to their device.

### Copying an object path
- When the user clicks Copy Path on an object,
  then the object's path is copied to the clipboard.

### Deleting a single object
- When the user clicks Delete on an object,
  then a confirmation dialog is shown.
- When the user confirms,
  then the object is removed from the list.
- When the user cancels,
  then nothing happens.

### Deleting multiple objects
- When the user selects one or more objects via the checkboxes and clicks Delete,
  then a confirmation dialog is shown indicating how many objects will be deleted.
- When the user confirms,
  then all selected objects are removed from the list.
- When the user cancels,
  then nothing happens and the selection is preserved.

### Selecting all objects
- When the user clicks the header checkbox,
  then all visible objects are selected.
- When the user clicks it again,
  then all objects are deselected.

### Properties tab
- When the user clicks the Properties tab,
  then they see read-only bucket metadata: name, region, visibility, object count,
  endpoint, versioning status, and encryption info — all matching the actual state of the bucket.

### Access control
- When the user navigates to the Buckets page,
  then they only see buckets they have been granted access to,
  and buckets belonging to other members are never shown.

## Settings

### Profile tab — viewing profile
- When the user opens the Settings page,
  then the Profile tab is shown by default with their avatar (initials), email, role, and account creation date.

### Profile tab — updating email
- When the user edits the email field and clicks Update,
  then the email is updated and a success message is shown.
- When the email field is empty or invalid,
  then the Update button is disabled.
- When the update request is in progress,
  then the button shows a loading indicator and is disabled.
- When the request fails,
  then an error message is shown and the email is not changed.

### Profile tab — changing password
- When the user fills in the old password, a new password, and the confirmation and submits,
  then the password is updated and a success message is shown.
- When the new password is fewer than 8 characters,
  then the submit button is disabled.
- When the new password and confirmation do not match,
  then the submit button is disabled.
- When the old password field is empty,
  then the submit button is disabled.
- When the request fails,
  then an error message is shown and the password is not changed.
- When the user clicks the eye icon on any password field,
  then the field toggles between hidden and visible text.

### Members tab (admin only)
- When the user is an admin, then the Members tab is visible.
- When the user opens the Members tab,
  then they see a list of all members with their email, role, and date added.
- When the user is not an admin, then the Members tab is not visible.

### Members tab — adding a member
- When the admin clicks Add Member and fills in a valid email, password (if SSO is disabled), and role, and submits,
  then the new member appears in the list.
- When the email field is empty,
  then the submit button is disabled.
- When SSO is disabled and the password is fewer than 8 characters,
  then the submit button is disabled.
- When SSO is enabled, the password field is optional.
- When the request is in progress,
  then the submit button shows a loading indicator and is disabled.
- When the request fails,
  then an error message is shown.

### Members tab — removing a member
- When the admin clicks Remove on a member,
  then a confirmation dialog is shown.
- When the admin confirms,
  then the member is removed from the list.
- When the admin cancels,
  then nothing happens.
- When the member shown is the currently logged-in user,
  then the Remove button is not visible, regardless of their role.

### Members tab — assigning permissions
- When the admin clicks Assign Permissions on a member and fills in a bucket name and permission level and submits,
  then the permissions are saved and the modal closes.
- When the bucket name is empty,
  then the submit button is disabled.
- When prefixes are left empty,
  then access is granted to the entire bucket.
- When the request is in progress,
  then the submit button shows a loading indicator and is disabled.
- When the request fails,
  then an error message is shown.

### Access Keys tab
- When the user opens the Access Keys tab,
  then they see the access key ID (masked by default) and its creation date.
- When the user clicks the eye icon,
  then the access key is revealed.
- When the user clicks Copy on the access key or secret key,
  then the value is copied to the clipboard.
- When the user clicks Regenerate,
  then a confirmation dialog is shown warning that the current key will be invalidated.
- When the user confirms,
  then a new access key and secret key are generated and shown.
- When the user cancels,
  then the existing key is preserved.

### Account tab
- When the user opens the Account tab,
  then they see read-only account information: email, account ID, and creation date.
