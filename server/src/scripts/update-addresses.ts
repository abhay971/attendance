import { prisma } from '../lib/prisma.js';
import { reverseGeocode } from '../lib/geocoding.js';

async function updateAddresses() {
  console.log('Starting address update...\n');

  try {
    // Get all attendance records
    const records = await prisma.attendance.findMany({
      orderBy: { checkInTime: 'desc' },
    });

    console.log(`Found ${records.length} attendance records to update\n`);

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      console.log(`[${i + 1}/${records.length}] Updating record ${record.id}...`);

      const updates: any = {};

      // Force update all addresses to get the latest format
      const forceUpdate = true;

      if (forceUpdate) {
        console.log(`  Updating check-in address: ${record.checkInAddress}`);
        console.log(`  Fetching address for: ${record.checkInLat}, ${record.checkInLng}`);

        const { address } = await reverseGeocode(record.checkInLat, record.checkInLng);
        updates.checkInAddress = address;

        console.log(`  ✓ Updated check-in address: ${address}`);
      } else {
        console.log(`  ✓ Check-in address looks good: ${record.checkInAddress}`);
      }

      // Update check-out address if exists
      if (record.checkOutLat && record.checkOutLng && record.checkOutAddress) {
        if (forceUpdate) {
          console.log(`  Updating check-out address: ${record.checkOutAddress}`);
          console.log(`  Fetching address for: ${record.checkOutLat}, ${record.checkOutLng}`);

          const { address } = await reverseGeocode(record.checkOutLat, record.checkOutLng);
          updates.checkOutAddress = address;

          console.log(`  ✓ Updated check-out address: ${address}`);
        } else {
          console.log(`  ✓ Check-out address looks good: ${record.checkOutAddress}`);
        }
      }

      // Update the record if there are changes
      if (Object.keys(updates).length > 0) {
        await prisma.attendance.update({
          where: { id: record.id },
          data: updates,
        });
        console.log(`  ✓ Record updated successfully`);
      } else {
        console.log(`  - No updates needed`);
      }

      console.log('');
    }

    console.log('✅ Address update completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating addresses:', error);
    process.exit(1);
  }
}

updateAddresses();
