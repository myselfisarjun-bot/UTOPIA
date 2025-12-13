import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ScrollView,
  Switch,
  Image,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { User } from '../types';
import { DatabaseService } from '../services/database';
import { getCurrentUser } from '../services/supabase';

const SettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const [user, setUser] = useState<User | null>(null);
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [selectedUserToBlock, setSelectedUserToBlock] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [editingProfile, setEditingProfile] = useState(false);
  const [showReasonPicker, setShowReasonPicker] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    age: '',
    bio: '',
  });

  const reportReasons = [
    'Inappropriate behavior',
    'Spam or fake profile',
    'Harassment',
    'Offensive content',
    'Underage user',
    'Impersonation',
    'Other'
  ];

  useFocusEffect(
    useCallback(() => {
      loadUserProfile();
    }, [])
  );

  const loadUserProfile = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (currentUser) {
        setUser({
          id: currentUser.id,
          name: currentUser.user_metadata?.name || '',
          age: currentUser.user_metadata?.age,
          bio: currentUser.user_metadata?.bio,
          profile_picture: currentUser.user_metadata?.profile_picture,
          created_at: currentUser.created_at,
          updated_at: currentUser.updated_at,
        });
        setProfileData({
          name: currentUser.user_metadata?.name || '',
          age: currentUser.user_metadata?.age?.toString() || '',
          bio: currentUser.user_metadata?.bio || '',
        });
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await DatabaseService.signOut();
              Alert.alert('Success', 'You have been logged out successfully.');
            } catch (error) {
              console.error('Error logging out:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleBlockUser = (userId: string, userName: string) => {
    setSelectedUserToBlock(userId);
    Alert.alert(
      'Block User',
      `Are you sure you want to block ${userName}? They will no longer be able to message you or see your profile.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            try {
              const success = await DatabaseService.blockUser(userId);
              if (success) {
                Alert.alert('Success', `${userName} has been blocked.`);
                navigation.navigate('Matches');
              } else {
                Alert.alert('Error', 'Failed to block user. Please try again.');
              }
            } catch (error) {
              console.error('Error blocking user:', error);
              Alert.alert('Error', 'Failed to block user. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleReportUser = (userId: string, userName: string) => {
    Alert.alert(
      'Report User',
      `Are you sure you want to report ${userName}? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Report',
          style: 'destructive',
          onPress: () => {
            setReportModalVisible(true);
          },
        },
      ]
    );
  };

  const submitReport = async () => {
    if (!reportReason) {
      Alert.alert('Error', 'Please select a reason for reporting.');
      return;
    }

    if (!selectedUserToBlock) return;

    try {
      const success = await DatabaseService.reportUser(
        selectedUserToBlock,
        reportReason,
        reportDescription
      );
      
      if (success) {
        Alert.alert('Success', 'User has been reported. Thank you for helping keep our community safe.');
        setReportModalVisible(false);
        setReportReason('');
        setReportDescription('');
        setSelectedUserToBlock(null);
      } else {
        Alert.alert('Error', 'Failed to report user. Please try again.');
      }
    } catch (error) {
      console.error('Error reporting user:', error);
      Alert.alert('Error', 'Failed to report user. Please try again.');
    }
  };

  const handleProfileUpdate = async () => {
    if (!profileData.name.trim()) {
      Alert.alert('Error', 'Name is required.');
      return;
    }

    try {
      const updates = {
        name: profileData.name.trim(),
        age: profileData.age ? parseInt(profileData.age, 10) : undefined,
        bio: profileData.bio.trim(),
      };

      const success = await DatabaseService.updateProfile(updates);
      if (success) {
        Alert.alert('Success', 'Profile updated successfully!');
        setEditingProfile(false);
        loadUserProfile();
      } else {
        Alert.alert('Error', 'Failed to update profile. Please try again.');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    }
  };

  const renderProfileModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={profileModalVisible}
      onRequestClose={() => setProfileModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Profile</Text>
            <TouchableOpacity onPress={() => setProfileModalVisible(false)}>
              <Icon name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            {user && (
              <View style={styles.profileSection}>
                <Image
                  source={{ 
                    uri: user.profile_picture || 'https://via.placeholder.com/100'
                  }}
                  style={styles.profilePicture}
                />
                
                {!editingProfile ? (
                  <View>
                    <Text style={styles.profileName}>{user.name}</Text>
                    {user.age && <Text style={styles.profileAge}>{user.age} years old</Text>}
                    {user.bio && <Text style={styles.profileBio}>{user.bio}</Text>}
                  </View>
                ) : (
                  <View style={styles.editForm}>
                    <TextInput
                      style={styles.input}
                      placeholder="Name"
                      value={profileData.name}
                      onChangeText={(text) => setProfileData(prev => ({ ...prev, name: text }))}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Age"
                      value={profileData.age}
                      onChangeText={(text) => setProfileData(prev => ({ ...prev, age: text }))}
                      keyboardType="numeric"
                    />
                    <TextInput
                      style={[styles.input, styles.bioInput]}
                      placeholder="Bio"
                      value={profileData.bio}
                      onChangeText={(text) => setProfileData(prev => ({ ...prev, bio: text }))}
                      multiline
                      numberOfLines={3}
                    />
                  </View>
                )}
              </View>
            )}
          </ScrollView>

          <View style={styles.modalFooter}>
            {!editingProfile ? (
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => setEditingProfile(true)}
              >
                <Text style={styles.primaryButtonText}>Edit Profile</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.editButtons}>
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => {
                    setEditingProfile(false);
                    loadUserProfile();
                  }}
                >
                  <Text style={styles.secondaryButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleProfileUpdate}
                >
                  <Text style={styles.primaryButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderReportModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={reportModalVisible}
      onRequestClose={() => setReportModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Report User</Text>
            <TouchableOpacity onPress={() => setReportModalVisible(false)}>
              <Icon name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <Text style={styles.inputLabel}>Reason for reporting:</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowReasonPicker(!showReasonPicker)}
            >
              <Text style={styles.pickerButtonText}>
                {reportReason || "Select a reason"}
              </Text>
              <Icon name="expand-more" size={20} color="#666" />
            </TouchableOpacity>
            
            {showReasonPicker && (
              <View style={styles.pickerOptions}>
                {reportReasons.map((reason) => (
                  <TouchableOpacity
                    key={reason}
                    style={styles.pickerOption}
                    onPress={() => {
                      setReportReason(reason);
                      setShowReasonPicker(false);
                    }}
                  >
                    <Text style={styles.pickerOptionText}>{reason}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <Text style={styles.inputLabel}>Additional details (optional):</Text>
            <TextInput
              style={[styles.input, styles.bioInput]}
              placeholder="Provide more details about the issue..."
              value={reportDescription}
              onChangeText={setReportDescription}
              multiline
              numberOfLines={3}
            />
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => setReportModalVisible(false)}
            >
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.primaryButton, styles.dangerButton]}
              onPress={submitReport}
            >
              <Text style={styles.primaryButtonText}>Submit Report</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Profile Section */}
        <TouchableOpacity
          style={styles.section}
          onPress={() => setProfileModalVisible(true)}
        >
          <Icon name="person" size={24} color="#FF6B6B" />
          <Text style={styles.sectionTitle}>Profile</Text>
          <Icon name="chevron-right" size={24} color="#ccc" />
        </TouchableOpacity>

        {/* Account Actions */}
        <View style={styles.sectionGroup}>
          <Text style={styles.sectionGroupTitle}>Account</Text>
          
          <TouchableOpacity style={styles.section}>
            <Icon name="notifications" size={24} color="#FF6B6B" />
            <Text style={styles.sectionTitle}>Notifications</Text>
            <Switch 
              value={true} 
              onValueChange={(value) => console.log('Notifications:', value)}
              trackColor={{ false: '#f0f0f0', true: '#ffcdd2' }}
              thumbColor="#FF6B6B"
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.section}>
            <Icon name="privacy-tip" size={24} color="#FF6B6B" />
            <Text style={styles.sectionTitle}>Privacy Settings</Text>
            <Icon name="chevron-right" size={24} color="#ccc" />
          </TouchableOpacity>
        </View>

        {/* Safety & Support */}
        <View style={styles.sectionGroup}>
          <Text style={styles.sectionGroupTitle}>Safety & Support</Text>
          
          <TouchableOpacity style={styles.section}>
            <Icon name="report-problem" size={24} color="#FF6B6B" />
            <Text style={styles.sectionTitle}>Report a Problem</Text>
            <Icon name="chevron-right" size={24} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.section}>
            <Icon name="help" size={24} color="#FF6B6B" />
            <Text style={styles.sectionTitle}>Help & Support</Text>
            <Icon name="chevron-right" size={24} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.section}>
            <Icon name="info" size={24} color="#FF6B6B" />
            <Text style={styles.sectionTitle}>About</Text>
            <Icon name="chevron-right" size={24} color="#ccc" />
          </TouchableOpacity>
        </View>

        {/* Danger Zone */}
        <View style={styles.sectionGroup}>
          <Text style={styles.sectionGroupTitle}>Danger Zone</Text>
          
          <TouchableOpacity style={[styles.section, styles.dangerSection]} onPress={handleLogout}>
            <Icon name="logout" size={24} color="#f44336" />
            <Text style={[styles.sectionTitle, styles.dangerText]}>Logout</Text>
            <Icon name="chevron-right" size={24} color="#f44336" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {renderProfileModal()}
      {renderReportModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionGroup: {
    marginBottom: 32,
  },
  sectionGroupTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  section: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dangerSection: {
    borderBottomColor: '#ffcdd2',
  },
  sectionTitle: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 16,
  },
  dangerText: {
    color: '#f44336',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalBody: {
    padding: 20,
    maxHeight: 400,
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  profileSection: {
    alignItems: 'center',
  },
  profilePicture: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  profileAge: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 12,
  },
  profileBio: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    lineHeight: 24,
  },
  editForm: {
    width: '100%',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#f8f8f8',
  },
  bioInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 8,
  },
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#f8f8f8',
    marginBottom: 16,
  },
  pickerButtonText: {
    fontSize: 16,
    color: '#333',
  },
  pickerOptions: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    marginBottom: 16,
  },
  pickerOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  pickerOptionText: {
    fontSize: 16,
    color: '#333',
  },
  primaryButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 8,
  },
  dangerButton: {
    backgroundColor: '#f44336',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  editButtons: {
    flexDirection: 'row',
  },
});

export default SettingsScreen;
