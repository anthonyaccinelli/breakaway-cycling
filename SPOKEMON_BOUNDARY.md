# SPOKEMON ISOLATED SOURCE BRANCH

This branch contains only the portable Spokemon standalone project and its tests/assets. It is deliberately NOT intended for merging into Breakaway's main branch.

Source snapshot is the extracted apps/spokemon directory in PR #80. The original Breakaway main branch and Cycle Quest code remain intact.

The source code is separated at the working-tree level, but the GitHub repository is not yet a separate repository. To achieve full repository independence, create a new blank GitHub repository, then push this branch's tree as the new repository's main. Once created, point the standalone Vercel project at that new repository. Do not delete old files or switch the production site before save migration and real hardware verification.

Current limitations remain: standalone FTMS resistance commands and Zwift Click controls not implemented; former-origin localStorage saves require explicit export, and hardware validation is pending.
