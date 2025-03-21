import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Image,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ExpoImagePicker from "expo-image-picker";
import defaultUserImage from "../../assets/images/default-user.png";
import defaultChildImage from "../../assets/images/default-child.png";

import { useAuth } from "../../context/auth-context";
import { useTheme } from "../../context/theme-context";
import { useChildActivity } from "../../context/child-activity-context";
import { useNotification } from "../../context/notification-context";

// Handle profile image selection with improved error handling
const handleSelectImage = async () => {
  try {
    console.log("Starting image selection process");

    // Request permission for media library
    const { status: mediaLibraryStatus } =
      await ExpoImagePicker.requestMediaLibraryPermissionsAsync();
    console.log("Media library permission status:", mediaLibraryStatus);

    if (mediaLibraryStatus !== "granted") {
      console.log("Permission denied for media library");
      Alert.alert(
        "Permission Required",
        "You need to grant permission to access your photos",
        [{ text: "OK" }]
      );
      return null;
    }

    // Configure options based on platform
    const pickerOptions = {
      mediaTypes: ExpoImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    };

    console.log("Launching image picker with options:", pickerOptions);

    // Launch image picker
    const result = await ExpoImagePicker.launchImageLibraryAsync(pickerOptions);

    console.log("Image picker result:", JSON.stringify(result));

    // Check if the user canceled the operation
    if (!result || result.canceled === true) {
      console.log("User canceled image selection");
      return null;
    }

    // Return the URI of the selected image
    if (result.assets && result.assets.length > 0 && result.assets[0].uri) {
      const imageUri = result.assets[0].uri;
      console.log("Selected image URI:", imageUri);
      return imageUri;
    } else {
      console.log("No valid image URI found in result");
      Alert.alert("Error", "Failed to get image. Please try again.");
      return null;
    }
  } catch (error) {
    console.error("Error selecting image:", error);
    Alert.alert(
      "Error",
      `Failed to select image: ${error.message}. Please try again.`,
      [{ text: "OK" }]
    );
    return null;
  }
};

export default function SettingsScreen({ navigation }) {
  const { theme, isGirlTheme, toggleTheme } = useTheme();
  const {
    children,
    currentChild,
    currentChildId,
    switchChild,
    addChild,
    removeChild,
    updateChildData,
  } = useChildActivity();
  const { user, token, logout, updateUserProfile, getCurrentUser } = useAuth();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showAddChildModal, setShowAddChildModal] = useState(false);
  const [newChildName, setNewChildName] = useState("");
  const [newChildAge, setNewChildAge] = useState("");
  const [newChildGender, setNewChildGender] = useState("male");
  const [newChildImage, setNewChildImage] = useState(null);
  const [newChildWeight, setNewChildWeight] = useState("");
  const [newChildHeight, setNewChildHeight] = useState("");
  const [newChildHeadCircumference, setNewChildHeadCircumference] =
    useState("");

  // User profile state
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [editUsername, setEditUsername] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileImage, setProfileImage] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [isSelectingImage, setIsSelectingImage] = useState(false);

  // Add these new state variables after the other state declarations
  const [showEditChildModal, setShowEditChildModal] = useState(false);
  const [editChildId, setEditChildId] = useState(null);
  const [editChildName, setEditChildName] = useState("");
  const [editChildAge, setEditChildAge] = useState("");
  const [editChildGender, setEditChildGender] = useState("other");
  const [editChildImage, setEditChildImage] = useState(null);
  const [isUsingDefaultChildImage, setIsUsingDefaultChildImage] =
    useState(false);
  const [editChildWeight, setEditChildWeight] = useState("");
  const [editChildHeight, setEditChildHeight] = useState("");
  const [editChildHeadCircumference, setEditChildHeadCircumference] =
    useState("");

  // Add this inside your SettingsScreen component, right after the other useState declarations
  const { settings, toggleNotifications, toggleHealthReminders } =
    useNotification();
  // Find the line where we're using the useNotification hook
  // Make sure this hook is called at the top level of the component, not inside a condition or loop
  // Also ensure that all hooks are called in the same order on every render

  // Check if there's any conditional rendering of hooks in the component
  // For example, make sure we're not doing something like:
  // if (condition) {
  //   useState(...) // This would cause the error
  // }

  // The most likely issue is that the useNotification hook might not be properly imported or defined
  // Make sure the import is correct:
  // import { useNotification } from "../contexts/notification-context"

  // Fetch user profile on component mount
  useEffect(() => {
    fetchUserProfile();
  }, [token]);

  // Fetch user profile from API
  const fetchUserProfile = async () => {
    if (!token) {
      console.log("No token available, using local user data");
      // If no token, use the local user data from auth context
      if (user) {
        console.log("Using local user data:", user);
        setUserProfile(user);
        setProfileImage(user.imageSrc);
      } else {
        setLoadError("No user data available");
      }
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadError(null);

    try {
      console.log("Fetching user profile with token");
      // Use the getCurrentUser from auth context
      const userData = await getCurrentUser(token);
      console.log("User data received:", userData);

      setUserProfile(userData);

      // Set default profile image if none exists
      setProfileImage(userData.imageSrc);
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
      setLoadError("Failed to load profile data");

      // Fallback to local user data if API fails
      if (user) {
        console.log("Falling back to local user data:", user);
        setUserProfile(user);
        setProfileImage(user.imageSrc);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Updated image selection handler with debounce
  const onSelectImage = async () => {
    if (isSelectingImage) return;

    try {
      setIsSelectingImage(true);
      const imageUri = await handleSelectImage();
      if (imageUri) {
        console.log("Setting profile image to:", imageUri);
        setProfileImage(imageUri);
      }
    } catch (error) {
      console.error("Error in onSelectImage:", error);
      Alert.alert("Error", "Failed to select image. Please try again.");
    } finally {
      setIsSelectingImage(false);
    }
  };

  // Add a function to handle child image selection with debounce
  const onSelectChildImage = async () => {
    if (isSelectingImage) return;

    try {
      setIsSelectingImage(true);
      const imageUri = await handleSelectImage();
      if (imageUri) {
        console.log("Setting child image to:", imageUri);
        setNewChildImage(imageUri);
      }
    } catch (error) {
      console.error("Error in onSelectChildImage:", error);
      Alert.alert("Error", "Failed to select image. Please try again.");
    } finally {
      setIsSelectingImage(false);
    }
  };

  // Add this function after onSelectChildImage
  // Function to handle selecting an image for editing a child
  const onSelectEditChildImage = async () => {
    if (isSelectingImage) return;

    try {
      setIsSelectingImage(true);
      const imageUri = await handleSelectImage();
      if (imageUri) {
        console.log("Setting edit child image to:", imageUri);
        setEditChildImage(imageUri);
        setIsUsingDefaultChildImage(false);
      }
    } catch (error) {
      console.error("Error in onSelectEditChildImage:", error);
      Alert.alert("Error", "Failed to select image. Please try again.");
    } finally {
      setIsSelectingImage(false);
    }
  };

  // Handle profile update
  const handleUpdateProfile = async () => {
    if (!userProfile) return;

    // Validate inputs
    if (editPassword && editPassword.length < 6) {
      Alert.alert(
        "Invalid Password",
        "Password must be at least 6 characters long"
      );
      return;
    }

    if (editPassword && editPassword !== confirmPassword) {
      Alert.alert("Password Mismatch", "Passwords do not match");
      return;
    }

    setIsUpdating(true);

    try {
      const updateData = {};

      // Check if username has changed - handle both name and username fields
      const currentName = userProfile.name || userProfile.username || "";
      if (editUsername && editUsername !== currentName) {
        updateData.name = editUsername;
      }

      if (editPassword) {
        updateData.password = editPassword;
      }

      if (profileImage && profileImage !== userProfile.imageSrc) {
        updateData.imageSrc = profileImage; // Changed from profileImage to imageSrc to match the expected field
      }

      // Only update if there are changes
      if (Object.keys(updateData).length === 0) {
        setShowEditProfileModal(false);
        setIsUpdating(false);
        return;
      }

      console.log("Updating profile with data:", updateData);

      // Use the updateUserProfile function from the auth context
      const updatedUser = await updateUserProfile(updateData);
      console.log("Profile updated successfully:", updatedUser);

      // Update local state
      setUserProfile({
        ...userProfile,
        ...updatedUser,
      });

      Alert.alert("Success", "Profile updated successfully");
      setShowEditProfileModal(false);

      // Reset form fields
      setEditPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("Failed to update profile:", error);
      Alert.alert(
        "Error",
        error.message || "Failed to update profile. Please try again."
      );
    } finally {
      setIsUpdating(false);
    }
  };

  // Open edit profile modal - Fixed function
  const openEditProfileModal = () => {
    console.log("Opening edit profile modal");
    console.log("User profile:", userProfile);

    if (userProfile) {
      // Set the initial values
      setEditUsername(userProfile.name || userProfile.username || "");
      setEditPassword("");
      setConfirmPassword("");

      // Show the modal
      setShowEditProfileModal(true);
      console.log("Modal should be visible now:", showEditProfileModal);
    } else {
      console.log("Cannot open modal: userProfile is null");
      Alert.alert("Error", "Unable to edit profile. User data not available.");
    }
  };

  // Add new child
  const handleAddChild = async () => {
    if (newChildName.trim() === "" || newChildAge.trim() === "") {
      Alert.alert("Required Fields", "Please enter both name and birth date");
      return;
    }

    // Validate date format (DD/MM/YYYY)
    const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    if (!dateRegex.test(newChildAge)) {
      Alert.alert(
        "Invalid Date",
        "Please enter the birth date in DD/MM/YYYY format"
      );
      return;
    }

    // Parse the date parts
    const [day, month, year] = newChildAge
      .split("/")
      .map((part) => Number.parseInt(part, 10));

    // Validate date values
    if (
      day < 1 ||
      day > 31 ||
      month < 1 ||
      month > 12 ||
      year < 1900 ||
      year > new Date().getFullYear()
    ) {
      Alert.alert("Invalid Date", "Please enter a valid birth date");
      return;
    }

    // Create date objects for validation
    const birthDate = new Date(year, month - 1, day); // month is 0-indexed in JS Date
    const today = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(today.getFullYear() - 1);

    // Check if birth date is in the future
    if (birthDate > today) {
      Alert.alert("Invalid Date", "Birth date cannot be in the future");
      return;
    }

    // Check if birth date is more than one year ago
    if (birthDate < oneYearAgo) {
      Alert.alert(
        "Invalid Date",
        "This app is only for infants under one year of age"
      );
      return;
    }

    // Validate weight, height, and head circumference
    if (newChildWeight.trim() === "") {
      Alert.alert("Required Field", "Please enter the child's weight in grams");
      return;
    }

    if (newChildHeight.trim() === "") {
      Alert.alert(
        "Required Field",
        "Please enter the child's height in millimeters"
      );
      return;
    }

    if (newChildHeadCircumference.trim() === "") {
      Alert.alert(
        "Required Field",
        "Please enter the child's head circumference in millimeters"
      );
      return;
    }

    // Validate that weight, height, and head circumference are numbers
    const weight = Number.parseInt(newChildWeight, 10);
    const height = Number.parseInt(newChildHeight, 10);
    const headCircumference = Number.parseInt(newChildHeadCircumference, 10);

    if (isNaN(weight) || weight <= 0) {
      Alert.alert("Invalid Weight", "Please enter a valid weight in grams");
      return;
    }

    if (isNaN(height) || height <= 0) {
      Alert.alert(
        "Invalid Height",
        "Please enter a valid height in millimeters"
      );
      return;
    }

    if (isNaN(headCircumference) || headCircumference <= 0) {
      Alert.alert(
        "Invalid Head Circumference",
        "Please enter a valid head circumference in millimeters"
      );
      return;
    }

    // Calculate age
    const birthDateForAge = new Date(year, month - 1, day); // month is 0-indexed in JS Date
    const current = new Date();
    let ageYears = current.getFullYear() - birthDateForAge.getFullYear();
    let ageMonths = current.getMonth() - birthDateForAge.getMonth();

    if (
      ageMonths < 0 ||
      (ageMonths === 0 && current.getDate() < birthDateForAge.getDate())
    ) {
      ageYears--;
      ageMonths += 12;
    }

    // Format age string
    let ageString = "";
    if (ageYears > 0) {
      ageString += `${ageYears} year${ageYears !== 1 ? "s" : ""}`;
    }
    if (ageMonths > 0) {
      if (ageString.length > 0) ageString += ", ";
      ageString += `${ageMonths} month${ageMonths !== 1 ? "s" : ""}`;
    }
    if (ageString === "") {
      ageString = "Less than 1 month";
    }

    const newChild = {
      name: newChildName,
      age: ageString,
      birthDate: newChildAge, // Store the birth date for future reference
      gender: newChildGender,
      imageSrc: newChildImage || "default", // Use a marker string to indicate default image
      weight: weight,
      height: height,
      headCircumference: headCircumference,
    };

    try {
      const childId = await addChild(newChild);
      if (childId) {
        Alert.alert("Success", "Child added successfully");
        setNewChildName("");
        setNewChildAge("");
        setNewChildGender("male");
        setNewChildImage(null);
        setNewChildWeight("");
        setNewChildHeight("");
        setNewChildHeadCircumference("");
        setShowAddChildModal(false);
      } else {
        Alert.alert("Error", "Failed to add child");
      }
    } catch (error) {
      console.error("Error adding child:", error);
      Alert.alert("Error", error.message || "Failed to add child");
    } finally {
      console.log(
        "Child added with image:",
        newChildImage || "Using default image"
      );
    }
  };

  // Function to handle editing a child
  const handleEditChild = (child) => {
    console.log("Editing child:", child);
    setEditChildId(child.id);
    setEditChildName(child.name);
    setEditChildAge(child.birthDate || "");
    setEditChildGender(child.gender || "other");
    setEditChildWeight(child.weight ? child.weight.toString() : "");
    setEditChildHeight(child.height ? child.height.toString() : "");
    setEditChildHeadCircumference(
      child.headCircumference ? child.headCircumference.toString() : ""
    );

    // Check if the child has a custom image or is using the default
    if (!child.imageSrc || child.imageSrc === "default") {
      setEditChildImage(null);
      setIsUsingDefaultChildImage(true);
      console.log("Using default image for edit");
    } else {
      setEditChildImage(child.imageSrc);
      setIsUsingDefaultChildImage(false);
      console.log("Using custom image for edit:", child.imageSrc);
    }

    setShowEditChildModal(true);
  };

  // Function to save edited child data
  const saveEditedChild = async () => {
    if (editChildName.trim() === "") {
      Alert.alert("Required Field", "Please enter the child's name");
      return;
    }

    const updatedChildData = {
      name: editChildName,
    };

    // Handle image - if using default, set to "default", otherwise use the selected image
    if (isUsingDefaultChildImage) {
      updatedChildData.imageSrc = "default";
    } else if (editChildImage) {
      updatedChildData.imageSrc = editChildImage;
    }

    try {
      const success = await updateChildData(editChildId, updatedChildData);
      if (success) {
        Alert.alert("Success", "Child updated successfully");
        setShowEditChildModal(false);
      } else {
        Alert.alert("Error", "Failed to update child");
      }
    } catch (error) {
      console.error("Error updating child:", error);
      Alert.alert("Error", error.message || "Failed to update child");
    }
  };

  // Add this function to handle child deletion with confirmation
  const handleDeleteChild = (childId) => {
    Alert.alert(
      "Confirm Deletion",
      "Are you sure you want to delete this child? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => removeChild(childId),
        },
      ]
    );
  };

  // Handle child selection
  const handleSelectChild = (childId) => {
    switchChild(childId);
  };

  // Handle logout with proper navigation reset
  const handleLogout = async () => {
    try {
      console.log("Logging out...");
      await logout();
      console.log("Logout successful");

      // We don't need to navigate manually - the NavigationContainer will handle this
      // when isAuthenticated changes to false in the auth context
    } catch (error) {
      console.error("Logout error:", error);
      Alert.alert("Error", "Failed to log out. Please try again.");
    }
  };

  // Render settings section
  const renderSection = (title, children) => {
    return (
      <View
        style={[
          styles.section,
          {
            backgroundColor: theme.cardBackground,
            shadowColor: theme.isDark ? "#000" : "#000",
          },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          {title}
        </Text>
        {children}
      </View>
    );
  };

  // Render setting item with toggle
  const renderToggleSetting = (icon, title, value, onValueChange) => {
    return (
      <View
        style={[styles.settingItem, { borderBottomColor: theme.borderLight }]}
      >
        <View style={styles.settingItemLeft}>
          <Ionicons
            name={icon}
            size={24}
            color={theme.primary}
            style={styles.settingIcon}
          />
          <Text style={[styles.settingText, { color: theme.text }]}>
            {title}
          </Text>
        </View>
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={theme.switchTrackColor}
          thumbColor={theme.switchThumbColor}
        />
      </View>
    );
  };

  // Render setting item with chevron
  const renderChevronSetting = (icon, title, onPress) => {
    return (
      <TouchableOpacity
        style={[styles.settingItem, { borderBottomColor: theme.borderLight }]}
        onPress={onPress}
      >
        <View style={styles.settingItemLeft}>
          <Ionicons
            name={icon}
            size={24}
            color={theme.primary}
            style={styles.settingIcon}
          />
          <Text style={[styles.settingText, { color: theme.text }]}>
            {title}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={theme.textTertiary} />
      </TouchableOpacity>
    );
  };

  // Replace the renderChildItem function with this enhanced version
  const renderChildItem = (child) => {
    if (!child) return null;

    const isCurrentChild = child.id === currentChildId;

    return (
      <View
        key={child.id}
        style={[
          styles.childItem,
          { borderBottomColor: theme.borderLight },
          isCurrentChild && { backgroundColor: `${theme.primary}15` },
        ]}
      >
        <TouchableOpacity
          style={styles.childMainContent}
          onPress={() => handleSelectChild(child.id)}
        >
          <Image
            source={
              child.imageSrc && child.imageSrc !== "default"
                ? { uri: child.imageSrc }
                : defaultChildImage
            }
            style={styles.childImage}
            onError={() =>
              console.log("Error loading child image, falling back to default")
            }
          />
          <View style={styles.childInfo}>
            <Text style={[styles.childName, { color: theme.text }]}>
              {child.name}
            </Text>
            <Text style={[styles.childAge, { color: theme.textSecondary }]}>
              {child.age}
            </Text>
            <Text style={[styles.childGender, { color: theme.textTertiary }]}>
              {child.gender === "male"
                ? "Male"
                : child.gender === "female"
                ? "Female"
                : "Other"}
            </Text>
            {child.weight && (
              <Text
                style={[
                  styles.childMeasurement,
                  { color: theme.textSecondary },
                ]}
              >
                Weight: {child.weight}g
              </Text>
            )}
            {child.height && (
              <Text
                style={[
                  styles.childMeasurement,
                  { color: theme.textSecondary },
                ]}
              >
                Height: {child.height}mm
              </Text>
            )}
            {child.headCircumference && (
              <Text
                style={[
                  styles.childMeasurement,
                  { color: theme.textSecondary },
                ]}
              >
                Head: {child.headCircumference}mm
              </Text>
            )}
          </View>
          {isCurrentChild && (
            <View
              style={[
                styles.currentChildIndicator,
                { backgroundColor: theme.primary },
              ]}
            >
              <Ionicons name="checkmark" size={12} color="#FFFFFF" />
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.childActions}>
          <TouchableOpacity
            style={styles.childEditButton}
            onPress={() => handleEditChild(child)}
          >
            <Ionicons name="create" size={22} color={theme.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.childDeleteButton}
            onPress={() => handleDeleteChild(child.id)}
          >
            <Ionicons name="trash" size={22} color={theme.danger} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Add Child Modal
  const renderAddChildModal = () => {
    return (
      <Modal
        visible={showAddChildModal}
        animationType="slide"
        transparent={true}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <View
            style={[
              styles.modalOverlay,
              { backgroundColor: theme.modalOverlay },
            ]}
          >
            <View
              style={[
                styles.modalContent,
                {
                  backgroundColor: theme.modalBackground,
                  shadowColor: theme.isDark ? "#000" : "#000",
                  width: "90%",
                  maxHeight: "90%",
                },
              ]}
            >
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>
                  Add New Child
                </Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setShowAddChildModal(false)}
                >
                  <Ionicons
                    name="close"
                    size={24}
                    color={theme.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody}>
                {/* Child Image */}
                <TouchableOpacity
                  style={styles.childImageContainer}
                  onPress={onSelectChildImage}
                  disabled={isSelectingImage}
                >
                  {newChildImage ? (
                    <Image
                      source={{ uri: newChildImage }}
                      style={styles.addChildImage}
                    />
                  ) : (
                    <View
                      style={[
                        styles.childImagePlaceholder,
                        { backgroundColor: `${theme.primary}30` },
                      ]}
                    >
                      {isSelectingImage ? (
                        <ActivityIndicator size="small" color={theme.primary} />
                      ) : (
                        <Image
                          source={defaultChildImage}
                          style={styles.addChildImage}
                        />
                      )}
                    </View>
                  )}
                  <View
                    style={[
                      styles.editImageBadge,
                      { backgroundColor: theme.primary + "80" },
                    ]}
                  >
                    <Ionicons name="camera" size={16} color="#FFFFFF" />
                  </View>
                </TouchableOpacity>

                {/* Child Name */}
                <View style={styles.inputContainer}>
                  <Text
                    style={[styles.inputLabel, { color: theme.textSecondary }]}
                  >
                    Child's Name *
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        borderColor: theme.border,
                        color: theme.text,
                        backgroundColor: theme.backgroundSecondary,
                      },
                    ]}
                    value={newChildName}
                    onChangeText={(text) => {
                      // Limit to 30 characters
                      if (text.length <= 30) {
                        setNewChildName(text);
                      }
                    }}
                    placeholder="Enter name"
                    placeholderTextColor={theme.textTertiary}
                    maxLength={30}
                  />
                </View>

                {/* Child Birth Date */}
                <View style={styles.inputContainer}>
                  <Text
                    style={[styles.inputLabel, { color: theme.textSecondary }]}
                  >
                    Child's Birth Date *
                  </Text>
                  <View
                    style={[
                      styles.datePickerContainer,
                      {
                        borderColor: theme.border,
                        backgroundColor: theme.backgroundSecondary,
                      },
                    ]}
                  >
                    <TextInput
                      style={[styles.dateInput, { color: theme.text }]}
                      value={newChildAge}
                      onChangeText={(text) => {
                        // Remove any non-numeric characters
                        const cleaned = text.replace(/[^0-9]/g, "");

                        // Format as DD/MM/YYYY automatically as user types
                        let formatted = "";
                        if (cleaned.length > 0) {
                          // Add first digit of day
                          formatted = cleaned.substring(
                            0,
                            Math.min(1, cleaned.length)
                          );

                          // Add second digit of day
                          if (cleaned.length > 1) {
                            formatted = cleaned.substring(0, 2);
                          }

                          // Add first slash and first digit of month
                          if (cleaned.length > 2) {
                            formatted = `${cleaned.substring(
                              0,
                              2
                            )}/${cleaned.substring(2, 3)}`;
                          }

                          // Add second digit of month
                          if (cleaned.length > 3) {
                            formatted = `${cleaned.substring(
                              0,
                              2
                            )}/${cleaned.substring(2, 4)}`;
                          }

                          // Add second slash and start of year
                          if (cleaned.length > 4) {
                            formatted = `${cleaned.substring(
                              0,
                              2
                            )}/${cleaned.substring(2, 4)}/${cleaned.substring(
                              4,
                              Math.min(8, cleaned.length)
                            )}`;
                          }
                        }

                        setNewChildAge(formatted);
                      }}
                      placeholder="DD/MM/YYYY"
                      placeholderTextColor={theme.textTertiary}
                      keyboardType="numeric"
                      maxLength={10}
                    />
                  </View>
                  <Text
                    style={[styles.dateHint, { color: theme.textTertiary }]}
                  >
                    Format: DD/MM/YYYY (e.g., 15/06/2022)
                  </Text>
                </View>

                {/* Child Gender */}
                <View style={styles.inputContainer}>
                  <Text
                    style={[styles.inputLabel, { color: theme.textSecondary }]}
                  >
                    Gender *
                  </Text>
                  <View style={styles.genderOptions}>
                    <TouchableOpacity
                      style={[
                        styles.genderOption,
                        newChildGender === "male" && {
                          backgroundColor: `${theme.primary}20`,
                          borderColor: theme.primary,
                        },
                      ]}
                      onPress={() => setNewChildGender("male")}
                    >
                      <Ionicons
                        name="male"
                        size={20}
                        color={
                          newChildGender === "male"
                            ? theme.primary
                            : theme.textSecondary
                        }
                      />
                      <Text
                        style={[
                          styles.genderText,
                          {
                            color:
                              newChildGender === "male"
                                ? theme.primary
                                : theme.textSecondary,
                          },
                        ]}
                      >
                        Male
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.genderOption,
                        newChildGender === "female" && {
                          backgroundColor: `${theme.primary}20`,
                          borderColor: theme.primary,
                        },
                      ]}
                      onPress={() => setNewChildGender("female")}
                    >
                      <Ionicons
                        name="female"
                        size={20}
                        color={
                          newChildGender === "female"
                            ? theme.primary
                            : theme.textSecondary
                        }
                      />
                      <Text
                        style={[
                          styles.genderText,
                          {
                            color:
                              newChildGender === "female"
                                ? theme.primary
                                : theme.textSecondary,
                          },
                        ]}
                      >
                        Female
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Child Weight */}
                <View style={styles.inputContainer}>
                  <Text
                    style={[styles.inputLabel, { color: theme.textSecondary }]}
                  >
                    Weight (grams) *
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        borderColor: theme.border,
                        color: theme.text,
                        backgroundColor: theme.backgroundSecondary,
                      },
                    ]}
                    value={newChildWeight}
                    onChangeText={(text) => {
                      // Remove non-numeric characters and limit to 4 digits
                      const numericText = text.replace(/[^0-9]/g, "");
                      if (numericText.length <= 4) {
                        setNewChildWeight(numericText);
                      }
                    }}
                    placeholder="Enter weight in grams"
                    placeholderTextColor={theme.textTertiary}
                    keyboardType="numeric"
                    maxLength={4}
                  />
                  <Text
                    style={[styles.dateHint, { color: theme.textTertiary }]}
                  >
                    Example: 3500 (for 3.5kg)
                  </Text>
                </View>

                {/* Child Height */}
                <View style={styles.inputContainer}>
                  <Text
                    style={[styles.inputLabel, { color: theme.textSecondary }]}
                  >
                    Height (millimeters) *
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        borderColor: theme.border,
                        color: theme.text,
                        backgroundColor: theme.backgroundSecondary,
                      },
                    ]}
                    value={newChildHeight}
                    onChangeText={(text) => {
                      // Remove non-numeric characters and limit to 3 digits
                      const numericText = text.replace(/[^0-9]/g, "");
                      if (numericText.length <= 3) {
                        setNewChildHeight(numericText);
                      }
                    }}
                    placeholder="Enter height in millimeters"
                    placeholderTextColor={theme.textTertiary}
                    keyboardType="numeric"
                    maxLength={3}
                  />
                  <Text
                    style={[styles.dateHint, { color: theme.textTertiary }]}
                  >
                    Example: 500 (for 50cm)
                  </Text>
                </View>

                {/* Child Head Circumference */}
                <View style={styles.inputContainer}>
                  <Text
                    style={[styles.inputLabel, { color: theme.textSecondary }]}
                  >
                    Head Circumference (millimeters) *
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        borderColor: theme.border,
                        color: theme.text,
                        backgroundColor: theme.backgroundSecondary,
                      },
                    ]}
                    value={newChildHeadCircumference}
                    onChangeText={(text) => {
                      // Remove non-numeric characters and limit to 3 digits
                      const numericText = text.replace(/[^0-9]/g, "");
                      if (numericText.length <= 3) {
                        setNewChildHeadCircumference(numericText);
                      }
                    }}
                    placeholder="Enter head circumference in millimeters"
                    placeholderTextColor={theme.textTertiary}
                    keyboardType="numeric"
                    maxLength={3}
                  />
                  <Text
                    style={[styles.dateHint, { color: theme.textTertiary }]}
                  >
                    Example: 350 (for 35cm)
                  </Text>
                </View>

                <Text
                  style={[
                    styles.requiredFieldsNote,
                    { color: theme.textSecondary },
                  ]}
                >
                  * Required fields
                </Text>
              </ScrollView>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    styles.cancelButton,
                    { backgroundColor: theme.backgroundSecondary },
                  ]}
                  onPress={() => setShowAddChildModal(false)}
                >
                  <Text
                    style={[
                      styles.cancelButtonText,
                      { color: theme.textSecondary },
                    ]}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    styles.addButton,
                    { backgroundColor: theme.primary },
                  ]}
                  onPress={handleAddChild}
                >
                  <Text style={styles.addButtonText}>Add Child</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    );
  };

  // Render Edit Child Modal
  const renderEditChildModal = () => {
    return (
      <Modal
        visible={showEditChildModal}
        animationType="slide"
        transparent={true}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <View
            style={[
              styles.modalOverlay,
              { backgroundColor: theme.modalOverlay },
            ]}
          >
            <View
              style={[
                styles.modalContent,
                {
                  backgroundColor: theme.modalBackground,
                  shadowColor: theme.isDark ? "#000" : "#000",
                  width: "90%",
                  maxHeight: "90%",
                },
              ]}
            >
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>
                  Edit Child
                </Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setShowEditChildModal(false)}
                >
                  <Ionicons
                    name="close"
                    size={24}
                    color={theme.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody}>
                {/* Child Image */}
                <TouchableOpacity
                  style={styles.childImageContainer}
                  onPress={onSelectEditChildImage}
                  disabled={isSelectingImage}
                >
                  {editChildImage ? (
                    <Image
                      source={{ uri: editChildImage }}
                      style={styles.addChildImage}
                    />
                  ) : (
                    <View
                      style={[
                        styles.childImagePlaceholder,
                        { backgroundColor: `${theme.primary}30` },
                      ]}
                    >
                      {isSelectingImage ? (
                        <ActivityIndicator size="small" color={theme.primary} />
                      ) : (
                        <Image
                          source={defaultChildImage}
                          style={styles.addChildImage}
                        />
                      )}
                    </View>
                  )}
                  <View
                    style={[
                      styles.editImageBadge,
                      { backgroundColor: theme.primary + "80" },
                    ]}
                  >
                    <Ionicons name="camera" size={16} color="#FFFFFF" />
                  </View>
                </TouchableOpacity>

                {/* Child Name */}
                <View style={styles.inputContainer}>
                  <Text
                    style={[styles.inputLabel, { color: theme.textSecondary }]}
                  >
                    Child's Name *
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        borderColor: theme.border,
                        color: theme.text,
                        backgroundColor: theme.backgroundSecondary,
                      },
                    ]}
                    value={editChildName}
                    onChangeText={(text) => {
                      // Limit to 30 characters
                      if (text.length <= 30) {
                        setEditChildName(text);
                      }
                    }}
                    placeholder="Enter name"
                    placeholderTextColor={theme.textTertiary}
                    maxLength={30}
                  />
                </View>

                {/* Child Birth Date - Disabled */}
                <View style={styles.inputContainer}>
                  <Text
                    style={[styles.inputLabel, { color: theme.textSecondary }]}
                  >
                    Child's Birth Date
                  </Text>
                  <View
                    style={[
                      styles.datePickerContainer,
                      {
                        borderColor: theme.border,
                        backgroundColor: theme.backgroundSecondary,
                        opacity: 0.7,
                      },
                    ]}
                  >
                    <TextInput
                      style={[styles.dateInput, { color: theme.textTertiary }]}
                      value={editChildAge}
                      editable={false}
                      placeholder="DD/MM/YYYY"
                      placeholderTextColor={theme.textTertiary}
                    />
                  </View>
                  <Text
                    style={[styles.dateHint, { color: theme.textTertiary }]}
                  >
                    Birth date cannot be changed after creation
                  </Text>
                </View>

                {/* Child Gender - Disabled */}
                <View style={styles.inputContainer}>
                  <Text
                    style={[styles.inputLabel, { color: theme.textSecondary }]}
                  >
                    Gender
                  </Text>
                  <View style={[styles.genderOptions, { opacity: 0.7 }]}>
                    <TouchableOpacity
                      style={[
                        styles.genderOption,
                        editChildGender === "male" && {
                          backgroundColor: `${theme.primary}20`,
                          borderColor: theme.primary,
                        },
                      ]}
                      disabled={true}
                    >
                      <Ionicons
                        name="male"
                        size={20}
                        color={
                          editChildGender === "male"
                            ? theme.primary
                            : theme.textSecondary
                        }
                      />
                      <Text
                        style={[
                          styles.genderText,
                          {
                            color:
                              editChildGender === "male"
                                ? theme.primary
                                : theme.textSecondary,
                          },
                        ]}
                      >
                        Male
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.genderOption,
                        editChildGender === "female" && {
                          backgroundColor: `${theme.primary}20`,
                          borderColor: theme.primary,
                        },
                      ]}
                      disabled={true}
                    >
                      <Ionicons
                        name="female"
                        size={20}
                        color={
                          editChildGender === "female"
                            ? theme.primary
                            : theme.textSecondary
                        }
                      />
                      <Text
                        style={[
                          styles.genderText,
                          {
                            color:
                              editChildGender === "female"
                                ? theme.primary
                                : theme.textSecondary,
                          },
                        ]}
                      >
                        Female
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <Text
                    style={[styles.dateHint, { color: theme.textTertiary }]}
                  >
                    Gender cannot be changed after creation
                  </Text>
                </View>

                {/* Child Weight - Disabled */}
                <View style={styles.inputContainer}>
                  <Text
                    style={[styles.inputLabel, { color: theme.textSecondary }]}
                  >
                    Weight (grams)
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        borderColor: theme.border,
                        color: theme.textTertiary,
                        backgroundColor: theme.backgroundSecondary,
                        opacity: 0.7,
                      },
                    ]}
                    value={editChildWeight}
                    editable={false}
                    placeholder="Weight in grams"
                    placeholderTextColor={theme.textTertiary}
                  />
                  <Text
                    style={[styles.dateHint, { color: theme.textTertiary }]}
                  >
                    Weight cannot be changed after creation
                  </Text>
                </View>

                {/* Child Height - Disabled */}
                <View style={styles.inputContainer}>
                  <Text
                    style={[styles.inputLabel, { color: theme.textSecondary }]}
                  >
                    Height (millimeters)
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        borderColor: theme.border,
                        color: theme.textTertiary,
                        backgroundColor: theme.backgroundSecondary,
                        opacity: 0.7,
                      },
                    ]}
                    value={editChildHeight}
                    editable={false}
                    placeholder="Height in millimeters"
                    placeholderTextColor={theme.textTertiary}
                  />
                  <Text
                    style={[styles.dateHint, { color: theme.textTertiary }]}
                  >
                    Height cannot be changed after creation
                  </Text>
                </View>

                {/* Child Head Circumference - Disabled */}
                <View style={styles.inputContainer}>
                  <Text
                    style={[styles.inputLabel, { color: theme.textSecondary }]}
                  >
                    Head Circumference (millimeters)
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        borderColor: theme.border,
                        color: theme.textTertiary,
                        backgroundColor: theme.backgroundSecondary,
                        opacity: 0.7,
                      },
                    ]}
                    value={editChildHeadCircumference}
                    editable={false}
                    placeholder="Head circumference in millimeters"
                    placeholderTextColor={theme.textTertiary}
                  />
                  <Text
                    style={[styles.dateHint, { color: theme.textTertiary }]}
                  >
                    Head circumference cannot be changed after creation
                  </Text>
                </View>

                <Text
                  style={[
                    styles.requiredFieldsNote,
                    { color: theme.textSecondary },
                  ]}
                >
                  * Required fields
                </Text>
              </ScrollView>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    styles.cancelButton,
                    { backgroundColor: theme.backgroundSecondary },
                  ]}
                  onPress={() => setShowEditChildModal(false)}
                >
                  <Text
                    style={[
                      styles.cancelButtonText,
                      { color: theme.textSecondary },
                    ]}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    styles.addButton,
                    { backgroundColor: theme.primary },
                  ]}
                  onPress={saveEditedChild}
                >
                  <Text style={styles.addButtonText}>Save Changes</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    );
  };

  // Edit Profile Modal
  const renderEditProfileModal = () => {
    return (
      <Modal
        visible={showEditProfileModal}
        animationType="slide"
        transparent={true}
      >
        <View
          style={[styles.modalOverlay, { backgroundColor: theme.modalOverlay }]}
        >
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: theme.modalBackground,
                shadowColor: theme.isDark ? "#000" : "#000",
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                Edit Profile
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowEditProfileModal(false)}
              >
                <Ionicons name="close" size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <TouchableOpacity
                style={styles.profileImageContainer}
                onPress={onSelectImage}
                disabled={isSelectingImage}
              >
                <Image
                  source={
                    profileImage ? { uri: profileImage } : defaultUserImage
                  }
                  style={styles.editProfileImage}
                />
                <View
                  style={[
                    styles.editImageOverlay,
                    { backgroundColor: theme.primary + "80" },
                  ]}
                >
                  {isSelectingImage ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Ionicons name="camera" size={24} color="#FFFFFF" />
                  )}
                </View>
              </TouchableOpacity>

              <View style={styles.inputContainer}>
                <Text
                  style={[styles.inputLabel, { color: theme.textSecondary }]}
                >
                  Username
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      borderColor: theme.border,
                      color: theme.text,
                      backgroundColor: theme.backgroundSecondary,
                    },
                  ]}
                  value={editUsername}
                  onChangeText={(text) => {
                    // Limit to 30 characters
                    if (text.length <= 30) {
                      setEditUsername(text);
                    }
                  }}
                  placeholder="Enter username"
                  placeholderTextColor={theme.textTertiary}
                  maxLength={30}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text
                  style={[styles.inputLabel, { color: theme.textSecondary }]}
                >
                  New Password
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      borderColor: theme.border,
                      color: theme.text,
                      backgroundColor: theme.backgroundSecondary,
                    },
                  ]}
                  value={editPassword}
                  onChangeText={setEditPassword}
                  placeholder="Enter new password (optional)"
                  placeholderTextColor={theme.textTertiary}
                  secureTextEntry
                />
              </View>

              <View style={styles.inputContainer}>
                <Text
                  style={[styles.inputLabel, { color: theme.textSecondary }]}
                >
                  Confirm Password
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      borderColor: theme.border,
                      color: theme.text,
                      backgroundColor: theme.backgroundSecondary,
                    },
                  ]}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirm new password"
                  placeholderTextColor={theme.textTertiary}
                  secureTextEntry
                />
              </View>
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.cancelButton,
                  { backgroundColor: theme.backgroundSecondary },
                ]}
                onPress={() => setShowEditProfileModal(false)}
                disabled={isUpdating}
              >
                <Text
                  style={[
                    styles.cancelButtonText,
                    { color: theme.textSecondary },
                  ]}
                >
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.addButton,
                  { backgroundColor: theme.primary },
                ]}
                onPress={handleUpdateProfile}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.addButtonText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: theme.backgroundSecondary },
        ]}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.text }]}>
            Loading profile...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loadError && !userProfile) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: theme.backgroundSecondary },
        ]}
      >
        <View style={styles.loadingContainer}>
          <Ionicons name="alert-circle" size={50} color={theme.danger} />
          <Text style={[styles.errorText, { color: theme.danger }]}>
            {loadError}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: theme.primary }]}
            onPress={fetchUserProfile}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.backgroundSecondary }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Section */}
        <View
          style={[
            styles.profileSection,
            {
              backgroundColor: theme.cardBackground,
              shadowColor: theme.isDark ? "#000" : "#000",
            },
          ]}
        >
          <Image
            source={profileImage ? { uri: profileImage } : defaultUserImage}
            style={styles.profileImage}
          />
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: theme.text }]}>
              {userProfile?.name ||
                userProfile?.username ||
                user?.name ||
                user?.username ||
                "User"}
            </Text>
            <Text style={[styles.profileEmail, { color: theme.textSecondary }]}>
              {userProfile?.email || user?.email || "user@example.com"}
            </Text>
            <Text style={[styles.profileRole, { color: theme.primary }]}>
              Parent
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.editProfileButton,
              { backgroundColor: theme.backgroundSecondary },
            ]}
            onPress={openEditProfileModal}
          >
            <Text style={[styles.editProfileText, { color: theme.primary }]}>
              Edit Profile
            </Text>
          </TouchableOpacity>
        </View>

        {/* Children Section */}
        {renderSection(
          "Children",
          <View>
            {children.map((child) => renderChildItem(child))}

            <TouchableOpacity
              style={[
                styles.addChildButton,
                { backgroundColor: theme.primary },
              ]}
              onPress={() => setShowAddChildModal(true)}
            >
              <Ionicons name="add-circle" size={20} color="#FFFFFF" />
              <Text style={styles.addChildText}>Add Child</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* App Settings Section */}
        {renderSection(
          "App Settings",
          <View>
            {renderToggleSetting(
              "notifications",
              "Notifications",
              notificationsEnabled,
              setNotificationsEnabled
            )}
            {renderToggleSetting(
              "notifications",
              "Vaccination Reminders",
              settings.healthReminders,
              toggleHealthReminders
            )}
            <View
              style={[
                styles.settingItem,
                { borderBottomColor: theme.borderLight },
              ]}
            >
              <View style={styles.settingItemLeft}>
                <Ionicons
                  name="color-palette"
                  size={24}
                  color={theme.primary}
                  style={styles.settingIcon}
                />
                <Text style={[styles.settingText, { color: theme.text }]}>
                  Theme
                </Text>
              </View>
              <View style={styles.themeIndicator}>
                <Ionicons
                  name={isGirlTheme ? "female" : "male"}
                  size={22}
                  color={theme.primary}
                />
                <Text
                  style={[
                    styles.themeIndicatorText,
                    { color: theme.textSecondary, marginLeft: 6 },
                  ]}
                >
                  {isGirlTheme ? "Girl" : "Boy"}
                </Text>
              </View>
            </View>
            {renderChevronSetting("language", "Language", () =>
              console.log("Language pressed")
            )}
            {renderChevronSetting("cloud-upload", "Data Backup", () =>
              console.log("Data Backup pressed")
            )}
          </View>
        )}

        {/* Account Section */}
        {renderSection(
          "Account",
          <View>
            {renderChevronSetting("shield-checkmark", "Privacy", () =>
              console.log("Privacy pressed")
            )}
            {renderChevronSetting("help-circle", "Help & Support", () =>
              console.log("Help pressed")
            )}
            {renderChevronSetting("log-out", "Sign Out", handleLogout)}
          </View>
        )}

        <Text style={[styles.versionText, { color: theme.textTertiary }]}>
          Version 1.0.0
        </Text>
      </ScrollView>

      {renderAddChildModal()}
      {renderEditChildModal()}
      {renderEditProfileModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
  },
  settingItemLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  settingIcon: {
    marginRight: 12,
  },
  settingText: {
    fontSize: 16,
    fontWeight: "400",
  },
  versionText: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 10,
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 4,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    marginBottom: 4,
  },
  profileRole: {
    fontSize: 14,
    fontWeight: "500",
  },
  editProfileButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  editProfileText: {
    fontSize: 14,
    fontWeight: "500",
  },
  childItem: {
    flexDirection: "column",
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    marginBottom: 8,
    borderRadius: 8,
  },
  childMainContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  childActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  childEditButton: {
    padding: 8,
    marginHorizontal: 8,
  },
  childDeleteButton: {
    padding: 8,
    marginHorizontal: 8,
  },
  childGender: {
    fontSize: 12,
    marginTop: 2,
  },
  childMeasurement: {
    fontSize: 12,
    marginTop: 2,
  },
  childImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginRight: 16,
  },
  childInfo: {
    flex: 1,
    paddingVertical: 4,
  },
  childName: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  childAge: {
    fontSize: 15,
    marginBottom: 2,
  },
  currentChildIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  addChildButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  addChildText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "80%",
    borderRadius: 12,
    padding: 20,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 4,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 16,
    textAlign: "center",
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 20,
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 120,
    alignItems: "center",
  },
  cancelButton: {},
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "500",
  },
  addButton: {},
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
  },
  profileImageContainer: {
    alignSelf: "center",
    marginBottom: 20,
    position: "relative",
  },
  editProfileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  editImageOverlay: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 10,
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 10,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
  },
  childImageContainer: {
    alignSelf: "center",
    marginBottom: 20,
    position: "relative",
  },
  addChildImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  childImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  editImageBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    maxHeight: "70%",
  },
  genderOptions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  genderOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#DDDDDD",
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
  },
  genderText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: "500",
  },
  requiredFieldsNote: {
    fontSize: 12,
    fontStyle: "italic",
    marginTop: 8,
    marginBottom: 16,
  },
  childMainContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  childActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  childEditButton: {
    padding: 8,
  },
  childDeleteButton: {
    padding: 8,
  },
  childGender: {
    fontSize: 12,
  },
  datePickerContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
  },
  dateInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 10,
  },
  calendarButton: {
    padding: 8,
  },
  dateHint: {
    fontSize: 12,
    marginTop: 4,
    fontStyle: "italic",
  },
  themeIndicator: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  themeIndicatorText: {
    fontSize: 14,
    fontWeight: "500",
  },
});
