# Sub-Account Console — Acceptance Criteria

## Login

### Successful login
- When the user enters a valid email and password and submits the form,
  then they are redirected to the Buckets page.

### Invalid credentials
- When the user submits with credentials that do not match any account,
  then an error message is shown and the user stays on the login page.

### Empty fields
- When the email or password field is empty,
  then the submit button is disabled and the form cannot be submitted.

### Loading state
- When the login request is in progress,
  then the submit button shows a loading indicator and is disabled.

### Persistent session
- When the user returns to the app with an active session,
  then they are redirected to the Buckets page without having to log in again.

### Expired or missing session
- When the session has expired or does not exist,
  then the user is redirected to the login page.

## Buckets

### Viewing the bucket list
- When the user navigates to the Buckets page,
  then they see a list of all buckets with their name, region, visibility (Public/Private), and creation date.
- When the page is loading,
  then a loading state is shown in place of the table.
- When there are no buckets,
  then an empty state is shown.

### Searching buckets
- When the user types in the search field,
  then the list filters in real time to show only buckets whose name contains the search term.
- When no buckets match the search term,
  then an empty state is shown.

### Opening a bucket
- When the user clicks on a bucket row,
  then they are navigated to that bucket's detail page.

### Creating a bucket (admin only)
- When the user is an admin, then the Create Bucket button is visible.
- When the user clicks Create Bucket and fills in a valid name and region and submits,
  then the bucket is created and appears in the list.
- When the bucket name does not follow S3 naming rules
  (3–63 characters, lowercase letters, numbers and hyphens only,
  must start and end with a letter or number, no consecutive hyphens),
  then an error is shown and the form cannot be submitted.
- When the create request is in progress,
  then the submit button shows a loading indicator and is disabled.
- When the user is not an admin, then the Create Bucket button is not visible.

### Deleting a bucket (admin only)
- When the user is an admin, then a context menu with a Delete option is visible on each bucket row.
- When the user selects Delete from the context menu,
  then a confirmation dialog is shown before the bucket is deleted.
- When the user confirms deletion,
  then the bucket is removed from the list.
- When the user cancels the confirmation dialog,
  then nothing happens and the bucket remains in the list.
- When the user is not an admin, then the context menu is not visible.

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

## Logout

### Successful logout
- When the user clicks Logout in the top bar,
  then their session is cleared and they are redirected to the login page.

### Session cleared
- When the user has logged out and tries to navigate back to any page,
  then they are redirected to the login page.
