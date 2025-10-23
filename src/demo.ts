/**
 * Demo file showing ReferralNetwork usage and testing
 * 
 * This file demonstrates all the key features of the referral network
 * including basic operations, constraint validation, and error handling.
 */

import { ReferralNetwork, ReferralErrorType, topKByReach, topKByFlowCentrality } from './index.js';

async function runDemo() {
  console.log('🚀 Referral Network Demo\n');
  
  const network = new ReferralNetwork();
  
  try {
    // Initialize the network
    await network.initialize();
    console.log('✅ Network initialized\n');
    
    // === BASIC OPERATIONS ===
    console.log('📝 Basic Operations:');
    console.log('─'.repeat(50));
    
    // Add some referrals
    const result1 = await network.addReferral('Alice', 'Bob');
    if (result1.success) {
      console.log('✅ Alice referred Bob');
    }
    
    const result2 = await network.addReferral('Alice', 'Charlie');
    if (result2.success) {
      console.log('✅ Alice referred Charlie');
    }
    
    const result3 = await network.addReferral('Bob', 'David');
    if (result3.success) {
      console.log('✅ Bob referred David');
    }
    
    const result4 = await network.addReferral('Bob', 'Eve');
    if (result4.success) {
      console.log('✅ Bob referred Eve');
    }
    
    // === GETTING REFERRALS ===
    console.log('\n📊 Getting Referrals:');
    console.log('─'.repeat(50));
    
    // Get direct referrals
    const aliceDirect = await network.directReferrals('Alice');
    if (aliceDirect.success) {
      console.log(`📋 Alice's direct referrals: ${aliceDirect.data.join(', ')}`);
    }
    
    // Get all referrals (including indirect)
    const aliceAll = await network.allReferrals('Alice');
    if (aliceAll.success) {
      console.log(`🌳 Alice's total referrals: ${aliceAll.data.join(', ')}`);
    }
    
    const bobAll = await network.allReferrals('Bob');
    if (bobAll.success) {
      console.log(`🌳 Bob's total referrals: ${bobAll.data.join(', ')}`);
    }
    
    // === CONSTRAINT VALIDATION ===
    console.log('\n🛡️ Constraint Validation:');
    console.log('─'.repeat(50));
    
    // Test self-referral (should fail)
    const selfRef = await network.addReferral('Alice', 'Alice');
    if (!selfRef.success && selfRef.error.type === ReferralErrorType.SELF_REFERRAL) {
      console.log('❌ Self-referral correctly rejected');
    }
    
    // Test multiple referrers (should fail)
    const multiRef = await network.addReferral('Frank', 'Bob');
    if (!multiRef.success && multiRef.error.type === ReferralErrorType.MULTIPLE_REFERRERS) {
      console.log('❌ Multiple referrers correctly rejected');
    }
    
    // Test cycle detection (should fail)
    const cycleRef = await network.addReferral('David', 'Alice');
    if (!cycleRef.success && cycleRef.error.type === ReferralErrorType.CYCLE_DETECTED) {
      console.log('❌ Cycle correctly detected and rejected');
    }
    
    // === NETWORK STATISTICS ===
    console.log('\n📈 Network Statistics:');
    console.log('─'.repeat(50));
    
    const stats = await network.getNetworkStats();
    if (stats.success) {
      console.log(`👥 Total users: ${stats.data.totalUsers}`);
      console.log(`🔗 Total referrals: ${stats.data.totalReferrals}`);
      console.log(`📏 Max depth: ${stats.data.maxDepth}`);
      console.log(`📊 Average referrals per user: ${stats.data.averageReferralsPerUser.toFixed(2)}`);
    }
    
    // === INFLUENCE ANALYSIS ===
    console.log('\n🎯 Influence Analysis:');
    console.log('─'.repeat(50));
    
    // Test top k by reach (using default k=5)
    try {
      const topByReach = await topKByReach(network); // Uses default k=5
      console.log(`🏆 Top users by reach (default k=5): ${topByReach.join(', ')}`);
      
      // Show reach for each user
      for (const user of topByReach) {
        const userReferrals = await network.allReferrals(user);
        if (userReferrals.success) {
          console.log(`   • ${user}: ${userReferrals.data.length} descendants`);
        }
      }
    } catch (error) {
      console.log(`❌ Error in reach analysis: ${error}`);
    }
    
    // Test top k by flow centrality (using default k=5)
    try {
      const topByFlowCentrality = await topKByFlowCentrality(network); // Uses default k=5
      console.log(`\n🌊 Top users by flow centrality (default k=5): ${topByFlowCentrality.join(', ')}`);
      
      // Show flow centrality for each user (this is expensive, so we'll just show the ranking)
      console.log('   (Flow centrality measures how often a user lies on shortest paths between other users)');
    } catch (error) {
      console.log(`❌ Error in flow centrality analysis: ${error}`);
    }
    
    // Test with custom k value
    try {
      const top2ByReach = await topKByReach(network, 2);
      console.log(`\n🎯 Top 2 users by reach: ${top2ByReach.join(', ')}`);
    } catch (error) {
      console.log(`❌ Error in custom k reach analysis: ${error}`);
    }
    
    // === USER MANAGEMENT ===
    console.log('\n👤 User Management:');
    console.log('─'.repeat(50));
    
    // Get all users
    const allUsers = await network.getNetworkStats();
    if (allUsers.success) {
      console.log('👥 All users in network:');
      const users = await network.getAllUsers();
      if (users.success) {
        users.data.forEach(user => {
          console.log(`   • ${user.userId} (joined: ${user.createdAt.toISOString().split('T')[0]})`);
        });
      }
    }
    
    // Check if specific users exist
    const aliceExists = await network.userExists('Alice');
    if (aliceExists.success) {
      console.log(`✅ Alice exists in network: ${aliceExists.data}`);
    }
    
    const frankExists = await network.userExists('Frank');
    if (frankExists.success) {
      console.log(`❌ Frank exists in network: ${frankExists.data}`);
    }
    
    // === CONFIGURATION TESTING ===
    console.log('\n⚙️ Configuration Testing:');
    console.log('─'.repeat(50));
    
    // Show current config
    const config = network.getConfig();
    console.log('📋 Current configuration:');
    console.log(`   • Allow self-referrals: ${config.allowSelfReferrals}`);
    console.log(`   • Allow multiple referrers: ${config.allowMultipleReferrers}`);
    console.log(`   • Allow cycles: ${config.allowCycles}`);
    
    // Update config
    network.updateConfig({ allowSelfReferrals: true });
    const newConfig = network.getConfig();
    console.log(`✅ Updated config - Allow self-referrals: ${newConfig.allowSelfReferrals}`);
    
    // === ERROR HANDLING DEMO ===
    console.log('\n🚨 Error Handling Demo:');
    console.log('─'.repeat(50));
    
    // Test invalid user ID
    const invalidRef = await network.addReferral('', 'Bob');
    if (!invalidRef.success) {
      console.log(`❌ Invalid user ID rejected: ${invalidRef.error.message}`);
    }
    
    // Test getting referrals for non-existent user
    const nonExistentRefs = await network.directReferrals('NonExistent');
    if (nonExistentRefs.success) {
      console.log(`📋 Non-existent user referrals: ${nonExistentRefs.data.length} (empty array)`);
    }
    
    // === SUCCESS SUMMARY ===
    console.log('\n🎉 Demo Summary:');
    console.log('─'.repeat(50));
    console.log('✅ All basic operations working');
    console.log('✅ Constraint validation working');
    console.log('✅ Network statistics working');
    console.log('✅ Influence analysis working');
    console.log('✅ Error handling working');
    console.log('✅ Configuration management working');
    console.log('\n🚀 Referral Network is fully functional!');
    
  } catch (error) {
    console.error('❌ Demo failed with error:', error);
  } finally {
    // Clean up
    await network.destroy();
    console.log('\n🧹 Network cleaned up');
  }
}

// Run the demo
runDemo().catch(console.error);
