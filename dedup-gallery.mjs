/**
 * DJPEPE.WTF — Gallery Dedup Cleanup Script
  *
   * Identified: 97 duplicate groups, 158 files to delete
    * Strategy: Keep the NEWEST copy of each (most recent uploadedAt), delete the rest
     *
      * Run from project root:
       *   ADMIN_TOKEN=your_token node dedup-gallery.mjs
        *
         * Or with dry-run (no actual deletes):
          *   ADMIN_TOKEN=your_token node dedup-gallery.mjs --dry-run
           */

           const ADMIN_TOKEN = process.env.ADMIN_TOKEN;
           const BASE_URL    = 'https://djpepe.wtf';
           const DRY_RUN     = process.argv.includes('--dry-run');

           if (!ADMIN_TOKEN) {
             console.error('Set ADMIN_TOKEN env var first.');
               process.exit(1);
               }

               if (DRY_RUN) console.log('DRY RUN - no files will be deleted\n');

               async function fetchAllFiles() {
                 const res  = await fetch(`${BASE_URL}/api/gallery?limit=1000`);
                   const data = await res.json();
                     return data.files || [];
                     }

                     function groupByBase(files) {
                       const groups = {};
                         for (const f of files) {
                             const base = f.name.replace(/-[a-zA-Z0-9]{10,35}(\.[^.]+)$/, '$1').toLowerCase();
                                 if (!groups[base]) groups[base] = [];
                                     groups[base].push(f);
                                       }
                                         return groups;
                                         }

                                         async function deleteFile(url) {
                                           const res = await fetch(`${BASE_URL}/api/gallery-delete`, {
                                               method: 'POST',
                                                   headers: {
                                                         'Content-Type': 'application/json',
                                                               'x-admin-token': ADMIN_TOKEN,
                                                                   },
                                                                       body: JSON.stringify({ url }),
                                                                         });
                                                                           const data = await res.json();
                                                                             if (!res.ok) throw new Error(data.error || res.statusText);
                                                                               return data;
                                                                               }

                                                                               const files  = await fetchAllFiles();
                                                                               console.log(`Total files in gallery: ${files.length}`);

                                                                               const groups = groupByBase(files);
                                                                               const dupGroups = Object.entries(groups).filter(([, copies]) => copies.length > 1);

                                                                               console.log(`Duplicate groups found: ${dupGroups.length}`);

                                                                               let totalToDelete = 0;
                                                                               let deleted = 0;
                                                                               let failed  = 0;
                                                                               const failures = [];

                                                                               for (const [base, copies] of dupGroups.sort((a, b) => b[1].length - a[1].length)) {
                                                                                 const sorted   = [...copies].sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
                                                                                   const keeper   = sorted[0];
                                                                                     const toDelete = sorted.slice(1);
                                                                                       totalToDelete += toDelete.length;

                                                                                         console.log(`\n[x${copies.length}] ${base}`);
                                                                                           console.log(`  KEEP  : ${keeper.name}`);

                                                                                             for (const dup of toDelete) {
                                                                                                 console.log(`  DELETE: ${dup.name}`);
                                                                                                     if (!DRY_RUN) {
                                                                                                           try {
                                                                                                                   await deleteFile(dup.url);
                                                                                                                           deleted++;
                                                                                                                                   console.log(`         -> deleted`);
                                                                                                                                         } catch (err) {
                                                                                                                                                 failed++;
                                                                                                                                                         failures.push({ name: dup.name, url: dup.url, error: err.message });
                                                                                                                                                                 console.error(`         -> FAILED: ${err.message}`);
                                                                                                                                                                       }
                                                                                                                                                                             await new Promise(r => setTimeout(r, 100));
                                                                                                                                                                                 }
                                                                                                                                                                                   }
                                                                                                                                                                                   }
                                                                                                                                                                                   
                                                                                                                                                                                   console.log('\n======================================');
                                                                                                                                                                                   console.log('SUMMARY');
                                                                                                                                                                                   console.log('======================================');
                                                                                                                                                                                   console.log(`Duplicate groups : ${dupGroups.length}`);
                                                                                                                                                                                   console.log(`Files to delete  : ${totalToDelete}`);
                                                                                                                                                                                   if (!DRY_RUN) {
                                                                                                                                                                                     console.log(`Deleted          : ${deleted}`);
                                                                                                                                                                                       console.log(`Failed           : ${failed}`);
                                                                                                                                                                                         if (failures.length > 0) {
                                                                                                                                                                                             console.log('\nFailed deletions:');
                                                                                                                                                                                                 failures.forEach(f => console.log(`  - ${f.name}: ${f.error}`));
                                                                                                                                                                                                   }
                                                                                                                                                                                                     console.log(`\nGallery should now have ~${files.length - deleted} files.`);
                                                                                                                                                                                                     } else {
                                                                                                                                                                                                       console.log(`\n[DRY RUN] Would delete ${totalToDelete} files. Re-run without --dry-run to execute.`);
                                                                                                                                                                                                       }
