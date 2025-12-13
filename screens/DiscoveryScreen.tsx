import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Image,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  Alert,
  Dimensions,
} from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { Button, Text } from '@/components';
import {
  getDiscoveryCandidates,
  likeProfile,
  passProfile,
  getDailyLikesRemaining,
  getProfileDetails,
  blockUser,
  reportUser,
  getPhotoSignedUrl,
} from '@/services/discovery';
import type { DiscoveryCandidate, Profile, ProfilePhoto, UserInterest } from '@/types/discovery';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_HEIGHT = SCREEN_HEIGHT * 0.7;

interface DiscoveryScreenProps {
  onNavigateToChat?: () => void;
}

export const DiscoveryScreen: React.FC<DiscoveryScreenProps> = ({ onNavigateToChat }) => {
  const theme = useTheme();
  const [candidates, setCandidates] = useState<DiscoveryCandidate[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [likesRemaining, setLikesRemaining] = useState<number>(0);
  const [likesLimit, setLikesLimit] = useState<number>(50);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [matchedProfile, setMatchedProfile] = useState<DiscoveryCandidate | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileDetails, setProfileDetails] = useState<{
    profile: Profile | null;
    photos: ProfilePhoto[];
    interests: UserInterest[];
  } | null>(null);
  const [profileDetailsLoading, setProfileDetailsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentCandidate = candidates[currentIndex];

  // Fetch initial candidates and likes remaining
  const fetchCandidates = useCallback(async (offset = 0) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await getDiscoveryCandidates({
        limit: 10,
        offset,
        maxDistanceKm: 100,
        photoExpiresIn: 3600,
      });

      if (fetchError) {
        setError(fetchError.message);
        return;
      }

      if (offset === 0) {
        setCandidates(data);
        setCurrentIndex(0);
      } else {
        setCandidates((prev) => [...prev, ...data]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load candidates');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchLikesRemaining = useCallback(async () => {
    const { remaining, limit, error: likesError } = await getDailyLikesRemaining();
    if (!likesError) {
      setLikesRemaining(remaining);
      setLikesLimit(limit);
    }
  }, []);

  useEffect(() => {
    fetchCandidates();
    fetchLikesRemaining();
  }, [fetchCandidates, fetchLikesRemaining]);

  // Fetch more candidates when nearing the end
  useEffect(() => {
    if (candidates.length > 0 && currentIndex >= candidates.length - 3) {
      fetchCandidates(candidates.length);
    }
  }, [currentIndex, candidates.length, fetchCandidates]);

  const handleLike = async () => {
    if (!currentCandidate || actionLoading) return;

    try {
      setActionLoading(true);
      const { data, error: likeError } = await likeProfile(currentCandidate.profile_id);

      if (likeError) {
        Alert.alert('Error', likeError.message);
        return;
      }

      if (data) {
        setLikesRemaining(data.likes_remaining);

        if (data.is_match) {
          // Show match modal
          setMatchedProfile(currentCandidate);
          setShowMatchModal(true);
        }
      }

      // Move to next candidate
      setCurrentIndex((prev) => prev + 1);
    } catch {
      Alert.alert('Error', 'Failed to like profile');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePass = async () => {
    if (!currentCandidate || actionLoading) return;

    try {
      setActionLoading(true);
      await passProfile(currentCandidate.profile_id);
      setCurrentIndex((prev) => prev + 1);
    } finally {
      setActionLoading(false);
    }
  };

  const handleShowProfile = async () => {
    if (!currentCandidate) return;

    setShowProfileModal(true);
    setProfileDetailsLoading(true);

    const {
      profile,
      photos,
      interests,
      error: detailsError,
    } = await getProfileDetails({
      profileId: currentCandidate.profile_id,
    });

    if (detailsError) {
      Alert.alert('Error', 'Failed to load profile details');
      setShowProfileModal(false);
      return;
    }

    // Get signed URLs for all photos
    const photosWithUrls = await Promise.all(
      photos.map(async (photo) => {
        const { url } = await getPhotoSignedUrl(photo.id);
        return { ...photo, signed_url: url };
      })
    );

    setProfileDetails({
      profile,
      photos: photosWithUrls as any,
      interests,
    });
    setProfileDetailsLoading(false);
  };

  const handleCloseMatchModal = () => {
    setShowMatchModal(false);
    setMatchedProfile(null);
  };

  const handleNavigateToChat = () => {
    handleCloseMatchModal();
    onNavigateToChat?.();
  };

  const handleBlock = async () => {
    if (!currentCandidate) return;

    Alert.alert(
      'Block User',
      'Are you sure you want to block this user? This will unmatch you if matched.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            const { error: blockError } = await blockUser(currentCandidate.profile_id);
            if (blockError) {
              Alert.alert('Error', 'Failed to block user');
            } else {
              setShowProfileModal(false);
              setCurrentIndex((prev) => prev + 1);
              Alert.alert('Success', 'User blocked');
            }
          },
        },
      ]
    );
  };

  const handleReport = () => {
    if (!currentCandidate) return;

    Alert.prompt(
      'Report User',
      'Please describe why you are reporting this user:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Report',
          style: 'destructive',
          onPress: async (reason?: string) => {
            if (reason) {
              const { error: reportError } = await reportUser(currentCandidate.profile_id, reason);
              if (reportError) {
                Alert.alert('Error', 'Failed to report user');
              } else {
                Alert.alert('Success', 'User reported. We will review your report.');
                setShowProfileModal(false);
              }
            }
          },
        },
      ],
      'plain-text'
    );
  };

  const calculateAge = (birthdate: string | null): number | null => {
    if (!birthdate) return null;
    const today = new Date();
    const birth = new Date(birthdate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  if (loading && candidates.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text variant="body1" style={styles.loadingText}>
            Finding matches...
          </Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.centerContent}>
          <Text variant="h5" style={styles.errorText}>
            {error}
          </Text>
          <Button title="Retry" onPress={() => fetchCandidates()} style={styles.retryButton} />
        </View>
      </View>
    );
  }

  if (!currentCandidate) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.centerContent}>
          <Text variant="h5" style={styles.emptyText}>
            No more profiles to show
          </Text>
          <Text variant="body2" color={theme.colors.textSecondary} style={styles.emptySubtext}>
            Check back later for new matches!
          </Text>
          <Button title="Refresh" onPress={() => fetchCandidates()} style={styles.refreshButton} />
        </View>
      </View>
    );
  }

  const age = profileDetails?.profile?.birthdate
    ? calculateAge(profileDetails.profile.birthdate)
    : null;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header with likes remaining */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <Text variant="h4">Discover</Text>
        <Text variant="body2" color={theme.colors.textSecondary}>
          {likesRemaining}/{likesLimit} likes remaining
        </Text>
      </View>

      {/* Profile Card */}
      <View style={styles.cardContainer}>
        <TouchableOpacity style={styles.card} activeOpacity={0.95} onPress={handleShowProfile}>
          {/* Photo */}
          {currentCandidate.primary_photo_signed_url ? (
            <Image
              source={{ uri: currentCandidate.primary_photo_signed_url }}
              style={styles.photo}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.photoPlaceholder, { backgroundColor: theme.colors.surface }]}>
              <Text variant="h3" color={theme.colors.textSecondary}>
                No Photo
              </Text>
            </View>
          )}

          {/* Info Overlay */}
          <View style={styles.infoOverlay}>
            <Text variant="h4" style={styles.name}>
              {currentCandidate.full_name || currentCandidate.username || 'Anonymous'}
              {profileDetails?.profile?.birthdate &&
                `, ${calculateAge(profileDetails.profile.birthdate)}`}
            </Text>
            {currentCandidate.bio && (
              <Text variant="body1" style={styles.bio} numberOfLines={3}>
                {currentCandidate.bio}
              </Text>
            )}
            {currentCandidate.distance_km !== null && (
              <Text variant="body2" style={styles.distance}>
                {Math.round(currentCandidate.distance_km)} km away
              </Text>
            )}
            <Text variant="caption" style={styles.tapHint}>
              Tap to see full profile
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.passButton, { backgroundColor: theme.colors.error }]}
          onPress={handlePass}
          disabled={actionLoading}
        >
          <Text variant="h5" style={styles.actionButtonText}>
            Pass
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.likeButton,
            { backgroundColor: theme.colors.success },
          ]}
          onPress={handleLike}
          disabled={actionLoading || likesRemaining <= 0}
        >
          {actionLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text variant="h5" style={styles.actionButtonText}>
              Like
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Match Modal */}
      <Modal
        visible={showMatchModal}
        transparent
        animationType="fade"
        onRequestClose={handleCloseMatchModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.matchModal, { backgroundColor: theme.colors.surface }]}>
            <Text variant="h3" style={styles.matchTitle}>
              🎉 It&apos;s a Match!
            </Text>
            <Text variant="body1" color={theme.colors.textSecondary} style={styles.matchMessage}>
              You and {matchedProfile?.full_name || matchedProfile?.username || 'this person'} liked
              each other!
            </Text>
            <Button
              title="Send Message"
              onPress={handleNavigateToChat}
              style={styles.matchButton}
            />
            <Button
              title="Keep Swiping"
              onPress={handleCloseMatchModal}
              variant="outline"
              style={styles.matchButton}
            />
          </View>
        </View>
      </Modal>

      {/* Profile Details Modal */}
      <Modal
        visible={showProfileModal}
        animationType="slide"
        onRequestClose={() => setShowProfileModal(false)}
      >
        <View style={[styles.profileModal, { backgroundColor: theme.colors.background }]}>
          <View style={[styles.profileModalHeader, { backgroundColor: theme.colors.surface }]}>
            <TouchableOpacity onPress={() => setShowProfileModal(false)}>
              <Text variant="h6" color={theme.colors.primary}>
                Close
              </Text>
            </TouchableOpacity>
            <Text variant="h6">Profile</Text>
            <View style={{ width: 50 }} />
          </View>

          {profileDetailsLoading ? (
            <View style={styles.centerContent}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          ) : (
            <ScrollView style={styles.profileModalContent}>
              {/* Photos Carousel */}
              {profileDetails?.photos && profileDetails.photos.length > 0 ? (
                <ScrollView
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  style={styles.photosCarousel}
                >
                  {profileDetails.photos.map((photo: any) => (
                    <Image
                      key={photo.id}
                      source={{
                        uri: photo.signed_url || currentCandidate.primary_photo_signed_url,
                      }}
                      style={styles.carouselPhoto}
                      resizeMode="cover"
                    />
                  ))}
                </ScrollView>
              ) : (
                <View style={[styles.photoPlaceholder, { backgroundColor: theme.colors.surface }]}>
                  <Text variant="h3" color={theme.colors.textSecondary}>
                    No Photos
                  </Text>
                </View>
              )}

              {/* Profile Info */}
              <View style={styles.profileInfo}>
                <Text variant="h4" style={styles.profileName}>
                  {profileDetails?.profile?.full_name ||
                    profileDetails?.profile?.username ||
                    'Anonymous'}
                  {age && `, ${age}`}
                </Text>

                {profileDetails?.profile?.bio && (
                  <View style={styles.section}>
                    <Text variant="h6" style={styles.sectionTitle}>
                      About
                    </Text>
                    <Text variant="body1" color={theme.colors.textSecondary}>
                      {profileDetails.profile.bio}
                    </Text>
                  </View>
                )}

                {profileDetails?.interests && profileDetails.interests.length > 0 && (
                  <View style={styles.section}>
                    <Text variant="h6" style={styles.sectionTitle}>
                      Interests
                    </Text>
                    <View style={styles.interestsContainer}>
                      {profileDetails.interests.map((interest) => (
                        <View
                          key={interest.interest_id}
                          style={[
                            styles.interestTag,
                            { backgroundColor: theme.colors.accentLight },
                          ]}
                        >
                          <Text variant="body2" color={theme.colors.accent}>
                            {interest.interest_name}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {profileDetails?.profile?.last_active_at && (
                  <View style={styles.section}>
                    <Text variant="body2" color={theme.colors.textSecondary}>
                      Last active:{' '}
                      {new Date(profileDetails.profile.last_active_at).toLocaleDateString()}
                    </Text>
                  </View>
                )}

                {/* Block/Report Actions */}
                <View style={styles.profileActions}>
                  <Button
                    title="Block User"
                    onPress={handleBlock}
                    variant="outline"
                    style={styles.profileActionButton}
                  />
                  <Button
                    title="Report User"
                    onPress={handleReport}
                    variant="outline"
                    style={styles.profileActionButton}
                  />
                </View>
              </View>
            </ScrollView>
          )}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingTop: 60,
    alignItems: 'center',
  },
  cardContainer: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  card: {
    height: CARD_HEIGHT,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  name: {
    color: '#FFFFFF',
    marginBottom: 4,
  },
  bio: {
    color: '#FFFFFF',
    marginBottom: 8,
  },
  distance: {
    color: '#FFFFFF',
    marginBottom: 4,
  },
  tapHint: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontStyle: 'italic',
  },
  actionsContainer: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 32,
    justifyContent: 'center',
    gap: 16,
  },
  actionButton: {
    width: 120,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  passButton: {},
  likeButton: {},
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
  },
  errorText: {
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    marginTop: 16,
  },
  emptyText: {
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    textAlign: 'center',
    marginBottom: 16,
  },
  refreshButton: {
    marginTop: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  matchModal: {
    width: '80%',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  matchTitle: {
    marginBottom: 16,
    textAlign: 'center',
  },
  matchMessage: {
    marginBottom: 24,
    textAlign: 'center',
  },
  matchButton: {
    width: '100%',
    marginBottom: 12,
  },
  profileModal: {
    flex: 1,
  },
  profileModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 60,
  },
  profileModalContent: {
    flex: 1,
  },
  photosCarousel: {
    height: 400,
  },
  carouselPhoto: {
    width: SCREEN_WIDTH,
    height: 400,
  },
  profileInfo: {
    padding: 16,
  },
  profileName: {
    marginBottom: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 8,
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  profileActions: {
    marginTop: 16,
    gap: 12,
  },
  profileActionButton: {
    marginBottom: 8,
  },
});
