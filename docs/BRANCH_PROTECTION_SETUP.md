# GitHub Branch Protection Setup Instructions

## To configure branch protection rules:

1. **Go to Settings** → **Branches** → **Add rule**

2. **Apply to branches**: `main`

3. **Require status checks to pass**:
   - ✓ Require branches to be up to date before merging
   - ✓ lint-frontend (all matrix combinations)
   - ✓ lint-backend (all matrix combinations)
   - ✓ test-frontend (all matrix combinations)
   - ✓ test-backend (all matrix combinations)
   - ✓ build-frontend (all matrix combinations)
   - ✓ build-backend (all matrix combinations)

4. **Additional protections**:
   - ✓ Require code reviews before merging (at least 1)
   - ✓ Dismiss stale pull request approvals when new commits are pushed
   - ✓ Require approval of the latest reviewable push
   - ✓ Require review from Code Owners (if CODEOWNERS exists)

5. **Require status checks**:
   - ✓ Require branches to be up to date before merging

6. **Click Create** to save the rule

## For develop branch:
Repeat with slightly less strict settings:
- At least 1 code review (vs main's 2)
- Can be merged even if review is dismissed
