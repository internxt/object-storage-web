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


## Feature: Billing

#### Scenario: Billing link is visible for an admin on a sub-account without a partner
  Given the user is an admin
  And the sub-account does not belong to a partner
  When the user views the console navbar
  Then a "Billing" link is visible next to the other tabs

#### Scenario: Billing link is not visible for sub-accounts with a partner
  Given the sub-account belongs to a partner
  When the user views the console navbar
  Then the "Billing" link is not visible, regardless of the user's role
  (billing for these accounts is managed through the partner instead)

#### Scenario: Billing link is not visible for non-admin members
  Given the user is not an admin
  And the sub-account does not belong to a partner
  When the user views the console navbar
  Then the "Billing" link is not visible

#### Scenario: Open the billing portal
  Given the "Billing" link is visible
  When the user clicks it
  Then a Stripe billing portal session is opened in a new tab,
  scoped to the sub-account's own Stripe customer


## Feature: Buckets section

### Viewing the bucket list
#### Scenario: View list of buckets
  Given the user is on the Buckets page
  Then they see a list of buckets with name, region and creation date

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

### Creating a bucket
#### Scenario: Create Bucket button is visible for users with write permissions
  Given the user has write permissions
  When the user is on the Buckets page
  Then the Create Bucket button is visible

#### Scenario: Create Bucket button is not visible for users without write permissions
  Given the user does not have write permissions
  When the user is on the Buckets page
  Then the Create Bucket button is not visible

#### Scenario: Open Create Bucket dialog
  Given the user has write permissions
  When the user clicks Create Bucket
  Then a dialog is shown with Bucket Name, Select Region, Bucket Versioning, Bucket Logging and Object Locking fields

#### Scenario: Successfully create a bucket
  Given the Create Bucket dialog is open
  When the user fills in a valid name and region and clicks Create
  Then the dialog is closed
  And the bucket is created and appears in the list

#### Scenario: Create button is disabled when required fields are empty
  Given the Create Bucket dialog is open
  When the Bucket Name or Select Region field is empty
  Then the Create button is disabled

#### Scenario: Create bucket with invalid name
  Given the Create Bucket dialog is open
  When the user enters a name that does not follow S3 naming rules
  (3–63 characters, lowercase letters, numbers and hyphens only,
  must start and end with a letter or number, no consecutive hyphens)
  Then an error is shown
  And the Create button is disabled

#### Scenario: Enable Bucket Versioning on creation
  Given the Create Bucket dialog is open
  When the user enables the Bucket Versioning toggle
  Then versioning will be enabled for the bucket on creation

#### Scenario: Enable Bucket Logging on creation
  Given the Create Bucket dialog is open
  When the user enables the Bucket Logging toggle
  Then logging will be enabled for the bucket on creation

#### Scenario: Object Locking requires Versioning
  Given the Create Bucket dialog is open
  And the Bucket Versioning toggle is disabled
  When the user views the Object Locking toggle
  Then the Object Locking toggle is disabled

#### Scenario: Enable Object Locking on creation
  Given the Create Bucket dialog is open
  And the Bucket Versioning toggle is enabled
  When the user enables the Object Locking toggle
  Then object locking will be permanently enabled for the bucket on creation

#### Scenario: Cancel bucket creation
  Given the Create Bucket dialog is open
  When the user clicks Cancel or the X button
  Then the dialog is closed and no bucket is created

#### Scenario: Create bucket request in progress
  Given the Create Bucket dialog is open
  And the create bucket request is in progress
  When the user views the Create button
  Then the Create button shows a loading indicator
  And the Create button is disabled

### Deleting a bucket

#### Scenario: Context menu is visible for users with write permissions
  Given the user has write permissions
  When the user is on the Buckets page
  Then a context menu icon is visible on each bucket row

#### Scenario: Context menu is not visible for users without write permissions
  Given the user does not have write permissions
  When the user is on the Buckets page
  Then the context menu icon is not visible

#### Scenario: Context menu shows View and Delete options
  Given the user has write permissions
  When the user clicks the context menu icon on a bucket row
  Then a menu is shown with View and Delete options

#### Scenario: Delete from context menu shows confirmation dialog
  Given the context menu is open
  When the user clicks Delete
  Then a confirmation dialog is shown requiring the user to type the bucket name to proceed

#### Scenario: Delete button in Properties shows confirmation dialog
  Given the user is on the bucket Properties tab
  When the user clicks Delete
  Then a confirmation dialog is shown requiring the user to type the bucket name to proceed

#### Scenario: Delete button is disabled until bucket name is typed
  Given the confirmation dialog is shown
  When the user has not typed the bucket name correctly
  Then the Delete button is disabled

#### Scenario: Confirm bucket deletion
  Given the confirmation dialog is shown
  When the user types the bucket name correctly and clicks Delete
  Then the bucket is deleted
  And the user is redirected to the Buckets page

#### Scenario: Cancel bucket deletion
  Given the confirmation dialog is shown
  When the user clicks the X button
  Then the dialog is closed and the bucket is not deleted

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

#### Scenario: Delete Selected is disabled when a non-empty folder is selected
  Given the user has selected a folder that contains objects or subfolders
  When the user views the Delete Selected button
  Then the Delete Selected button is disabled

#### Scenario: Delete Selected is enabled when an empty folder is selected
  Given the user has selected a folder that has no contents
  When the user views the Delete Selected button
  Then the Delete Selected button is enabled

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
  When the user drags and drops one or more files into the drop area
  Then the files are uploaded to the bucket
  And they appear in the object list

#### Scenario: Upload a folder via drag and drop
  Given the Upload Files dialog is open
  When the user drags and drops a folder into the drop area
  Then all files within that folder (including subfolders) are uploaded
  And their keys preserve the folder's structure as a prefix
  And they appear in the object list under that prefix

#### Scenario: Close Upload Files dialog by clicking outside
  Given the Upload Files dialog is open
  When the user clicks outside the dialog
  Then the dialog is closed

#### Scenario: Remove a single pending file from the upload list
  Given the Upload Files dialog is open
  And one or more files are pending upload
  When the user clicks the X icon on a file that is still pending
  Then that file is removed from the list
  And it is not uploaded

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

## Feature: Bucket detail - Properties

### Bucket Versioning

#### Scenario: View versioning status - Unversioned
  Given the bucket has never had versioning enabled
  When the user is on the Properties tab
  Then the Bucket Versioning section shows Unversioned as the current state

#### Scenario: View versioning status - Enabled
  Given the bucket has versioning enabled
  When the user is on the Properties tab
  Then the Bucket Versioning section shows Enabled as the current state

#### Scenario: View versioning status - Suspended
  Given the bucket has versioning suspended
  When the user is on the Properties tab
  Then the Bucket Versioning section shows Suspended as the current state

#### Scenario: Enable versioning shows confirmation dialog
  Given the bucket is in Unversioned state
  When the user selects Enable Versioning
  Then a confirmation dialog is shown

#### Scenario: Confirm enable versioning
  Given the Enable Versioning confirmation dialog is shown
  When the user clicks Confirm
  Then versioning is enabled for the bucket
  And the Bucket Versioning section shows Enabled as the current state

#### Scenario: Cancel enable versioning
  Given the Enable Versioning confirmation dialog is shown
  When the user clicks Cancel or the X button
  Then the dialog is closed and versioning remains unchanged

#### Scenario: Suspend versioning shows confirmation dialog
  Given the bucket has versioning enabled
  When the user selects Suspend Versioning on the Properties tab
  Then a confirmation dialog is shown

#### Scenario: Confirm suspend versioning
  Given the Suspend Versioning confirmation dialog is shown
  When the user clicks Confirm
  Then versioning is suspended for the bucket
  And the Bucket Versioning section shows Suspended as the current state

#### Scenario: Cancel suspend versioning
  Given the Suspend Versioning confirmation dialog is shown
  When the user clicks Cancel or the X button
  Then the dialog is closed and versioning remains unchanged

### Bucket Logging

#### Scenario: Enable Bucket Logging shows additional fields
  Given the user is on the Properties tab
  When the user enables the Enable Bucket Logging toggle
  Then the Logging Prefix field and Bucket to store logs dropdown become active

#### Scenario: Bucket to store logs dropdown shows available buckets
  Given the Enable Bucket Logging toggle is enabled
  When the user opens the Bucket to store logs dropdown
  Then a list of available buckets is shown

#### Scenario: Successfully update bucket logging
  Given the Enable Bucket Logging toggle is enabled
  And the user has selected a bucket to store logs
  When the user clicks Update
  Then the logging configuration is saved

#### Scenario: Disable Bucket Logging
  Given the Enable Bucket Logging toggle is enabled
  When the user disables the toggle
  And clicks Update
  Then logging is disabled for the bucket

### Object Locking

#### Scenario: Object Locking section shows informational message when not enabled at creation
  Given the bucket was created without Object Locking enabled
  When the user is on the Properties tab
  Then the Object Locking section shows an informational message explaining it must be enabled at creation time

#### Scenario: Object Locking section shows retention settings when enabled at creation
  Given the bucket was created with Object Locking enabled
  When the user is on the Properties tab
  Then the Enable Bucket-Level Object Retention toggle is visible

#### Scenario: Enable Bucket-Level Object Retention shows retention mode options
  Given the bucket was created with Object Locking enabled
  When the user enables the Enable Bucket-Level Object Retention toggle
  Then Governance Mode and Compliance Mode options are shown
  And Time Scale and Retention Time fields are shown

#### Scenario: Select Governance Mode
  Given the Enable Bucket-Level Object Retention toggle is enabled
  When the user selects Enable Governance Mode
  Then the Time Scale and Retention Time fields are required

#### Scenario: Select Compliance Mode
  Given the Enable Bucket-Level Object Retention toggle is enabled
  When the user selects Enable Compliance Mode
  Then the Time Scale and Retention Time fields are required

#### Scenario: Time Scale dropdown shows available options
  Given a retention mode is selected
  When the user opens the Time Scale dropdown
  Then Day(s) and Year(s) options are shown

#### Scenario: Update button is disabled when required fields are empty
  Given a retention mode is selected
  When the Time Scale or Retention Time field is empty
  Then the Update button is disabled

#### Scenario: Successfully configure bucket-level object retention
  Given a retention mode is selected
  And the user has filled in Time Scale and Retention Time
  When the user clicks Update
  Then the retention configuration is saved

### Delete Bucket

#### Scenario: Delete button is visible for users with write permissions
  Given the user has write permissions
  When the user is on the Properties tab
  Then the Delete button is visible

#### Scenario: Delete button is not visible for users without write permissions
  Given the user does not have write permissions
  When the user is on the Properties tab
  Then the Delete button is not visible

#### Scenario: Delete bucket from Properties shows confirmation dialog
  Given the user has write permissions
  When the user clicks Delete on the Properties tab
  Then a confirmation dialog is shown requiring the user to type the bucket name to proceed


## Usage

### Viewing usage stats
- When the user navigates to the Usage page,
  then they see the latest day's summary: active storage, deleted storage, and active object count.
- When the user views the Deleted Storage stat,
  then its caption indicates it reflects data deleted within the last 30 days.
- When the page is loading,
  then a loading state is shown in place of the stats and table.

### Account Usage info tooltip
- When the user hovers the info icon next to "Account Usage",
  then a tooltip explains that usage is calculated once per day, that the UI updates
  with the latest data once that daily job completes, and that new accounts and new
  buckets will not see data reported until the next day.

### Viewing daily records
- When the page loads,
  then a table shows daily usage records for the last 30 days by default,
  with columns: date, active storage, deleted storage, and active objects.
- When there are no records for the selected range,
  then an empty state is shown.

### Pagination
- When there are more usage records than fit on one page,
  then the user can change the page size (25/50/100) and navigate between pages,
  same as the pagination controls used elsewhere in the app.
- When the user is on the first page,
  then the previous page arrow is disabled.
- When the user navigates to a page with fewer records than the page size,
  then the next page arrow is disabled.
- When the user changes page size or the date range,
  then the table resets back to the first page.

### Filtering by date range
- When the user sets a From date,
  then all dates before it are disabled in the To date picker.
- The date range is capped at 3 months: when the user sets a From date,
  then dates more than 3 months after it are disabled in the To date picker,
  and if the currently selected To date falls outside that window, it is adjusted
  to stay within 3 months of the new From date. The same applies symmetrically
  when the user changes the To date.
- When the user sets a From and To date and applies the filter,
  then the table updates to show only records within that range.

### Record ordering
- When the table loads,
  then records are always shown in descending order by date (most recent first).
- The Record Date column header is not clickable/sortable.

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

#### Scenario: Session survives changing your own password
  Given the user is on the Profile tab with an active session
  When the user successfully changes their own password
  And the browser is refreshed afterwards
  Then the user remains logged in, instead of being redirected to login

#### Scenario: Clear error message for an incorrect old password
  Given the user is on the Profile tab changing their password
  When the user submits an old password that does not match their current password
  Then an error message reading "Incorrect old password" is shown
  And the password is not changed
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

#### Scenario: Adding a member with an email that is already in use
  Given the admin is on the Members tab
  And an active member with that email already exists for the sub-account
  When the admin fills in that email and submits the Add Member form
  Then an error message reading "A member with this email already exists" is shown
  And no new member is added to the list

### Members tab — removing a member
- When the admin clicks Remove on a member,
  then a confirmation dialog is shown.
- When the admin confirms,
  then the member is removed from the list.
- When the admin cancels,
  then nothing happens.
- When the member shown is the currently logged-in user,
  then the Remove button is not visible, regardless of their role.
- When a member removal is done, if the member's session is open and the browser
  is refreshed, then the session is immediately finished and the browser
  redirects to login.

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

#### Scenario: View account information
  Given the user is on the Settings page
  When the user opens the Account tab
  Then they see read-only account information: email, account ID,
  and a "Created at" field showing the sub-account (storage account) creation date
  And the "Created at" field never shows a "—" placeholder

#### Scenario: Profile and Account tabs show different creation dates
  Given the user is on the Settings page
  When the user compares the "Created at" field on the Profile tab and the Account tab
  Then the Profile tab shows when this member/user was added to the sub-account
  And the Account tab shows when the sub-account itself was created
  And both fields being present at the same time is expected, since they represent different dates
