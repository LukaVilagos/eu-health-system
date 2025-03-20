import { ref, watch } from "vue";
import type { PermissionSchemaType } from "../models/Todo";
import { PermissionLevel } from "../models/Todo";
import type { UserSchemaType } from "../../user/models/User";
import { getUserDocument } from "../../user/models/User";
import { searchUsersByEmail } from "../../user/hooks/useUserHooks";

type UserPermissionsEmits = {
  "update:modelValue": [permissions: Record<string, PermissionSchemaType>];
  "add-user": [
    data: {
      userId: string;
      user: {
        email: string;
        displayName: string | null;
        permissions: string[];
      };
    }
  ];
  "remove-user": [userId: string];
  "update-permissions": [data: { userId: string; permissions: string[] }];
};

export function useUserPermissions(
  props: {
    modelValue: Record<string, PermissionSchemaType>;
    existingUserIds: string[];
    ownerId: string;
    currentUserId: string;
    readOnly: boolean;
  },
  emit: {
    <K extends keyof UserPermissionsEmits>(
      event: K,
      ...args: UserPermissionsEmits[K]
    ): void;
  }
) {
  const userEmail = ref("");
  const selectedPermissions = ref<Record<string, string[]>>({});
  const sharedUsers = ref<
    Record<
      string,
      { email: string; displayName: string | null; permissions: string[] }
    >
  >({});
  const searchResults = ref<UserSchemaType[]>([]);
  const searchLoading = ref(false);
  const searchError = ref("");
  const loadingUserData = ref(false);

  const permissionOptions = [
    { name: "View", value: PermissionLevel.VIEW },
    { name: "Edit", value: PermissionLevel.EDIT },
    { name: "Delete", value: PermissionLevel.DELETE },
    { name: "Admin", value: PermissionLevel.ADMIN },
  ];

  const loadUserData = async (
    userId: string,
    permissionData: PermissionSchemaType
  ) => {
    try {
      loadingUserData.value = true;
      const userData = await getUserDocument(userId);

      if (userData) {
        sharedUsers.value[userId] = {
          email: userData.email || "",
          displayName: userData.displayName || null,
          permissions: permissionData.permissions,
        };
      } else {
        sharedUsers.value[userId] = {
          email: "",
          displayName: "Unknown User",
          permissions: permissionData.permissions,
        };
      }

      selectedPermissions.value[userId] = [...permissionData.permissions];
    } catch (error) {
      console.error(`Error fetching user data for ${userId}:`, error);
      sharedUsers.value[userId] = {
        email: "",
        displayName: "Unknown User",
        permissions: permissionData.permissions,
      };
      selectedPermissions.value[userId] = [...permissionData.permissions];
    } finally {
      loadingUserData.value = false;
    }
  };

  watch(
    () => props.modelValue,
    async (newValue) => {
      if (newValue) {
        const userPromises = [];

        for (const [userId, data] of Object.entries(newValue)) {
          if (!sharedUsers.value[userId]) {
            userPromises.push(loadUserData(userId, data));
          }
        }

        if (userPromises.length > 0) {
          await Promise.all(userPromises);
        }
      }
    },
    { immediate: true, deep: true }
  );

  const searchUsers = async (event: { query: string }) => {
    if (event.query.length < 2) return;

    searchLoading.value = true;
    searchError.value = "";

    try {
      const results = await searchUsersByEmail(event.query);

      searchResults.value = results.filter((user: UserSchemaType) => {
        if (user.id === props.ownerId) return false;
        if (sharedUsers.value[user.id]) return false;
        if (props.existingUserIds.includes(user.id)) return false;
        return true;
      });

      if (results.length > 0 && searchResults.value.length === 0) {
        searchError.value = "No eligible users found with this email";
      } else if (results.length === 0 && event.query.length > 2) {
        searchError.value = `No user found with email containing "${event.query}"`;
      }
    } catch (error) {
      console.error("Error searching users:", error);
      searchError.value = "Error searching for users";
    } finally {
      searchLoading.value = false;
    }
  };

  const addUser = async () => {
    if (!userEmail.value) return;

    searchLoading.value = true;
    searchError.value = "";

    try {
      const results = await searchUsersByEmail(userEmail.value);

      if (results.length === 0) {
        searchError.value = `No user found with email "${userEmail.value}"`;
        return;
      }

      const user = results[0];

      if (user.id === props.ownerId) {
        searchError.value = "Cannot add the owner to permissions";
        return;
      }

      if (
        sharedUsers.value[user.id] ||
        props.existingUserIds.includes(user.id)
      ) {
        searchError.value = "This user has already been added";
        return;
      }

      const userId = user.id;
      const defaultPermissions = [PermissionLevel.VIEW];

      sharedUsers.value[userId] = {
        email: user.email || "",
        displayName: user.displayName,
        permissions: defaultPermissions,
      };

      selectedPermissions.value[userId] = defaultPermissions;

      emit("add-user", {
        userId,
        user: {
          email: user.email || "",
          displayName: user.displayName,
          permissions: defaultPermissions,
        },
      });

      updateModelValue();
    } catch (error) {
      console.error("Error adding user:", error);
      searchError.value = "Error adding user";
    } finally {
      searchLoading.value = false;
      userEmail.value = "";
    }
  };

  const selectUser = (user: UserSchemaType) => {
    if (user.id === props.ownerId) {
      searchError.value = "Cannot add the owner to permissions";
      return;
    }

    if (sharedUsers.value[user.id] || props.existingUserIds.includes(user.id)) {
      searchError.value = "This user has already been added";
      return;
    }

    const userId = user.id;
    const defaultPermissions = [PermissionLevel.VIEW];

    sharedUsers.value[userId] = {
      email: user.email || "",
      displayName: user.displayName,
      permissions: defaultPermissions,
    };

    selectedPermissions.value[userId] = defaultPermissions;

    emit("add-user", {
      userId,
      user: {
        email: user.email || "",
        displayName: user.displayName,
        permissions: defaultPermissions,
      },
    });

    updateModelValue();
    userEmail.value = "";
    searchResults.value = [];
  };

  const removeUser = (userId: string) => {
    emit("remove-user", userId);

    delete sharedUsers.value[userId];
    delete selectedPermissions.value[userId];

    updateModelValue();
  };

  const updateModelValue = () => {
    const updatedPermissions: Record<string, PermissionSchemaType> = {};

    Object.entries(sharedUsers.value).forEach(([userId]) => {
      updatedPermissions[userId] = {
        permissions: selectedPermissions.value[userId] || [
          PermissionLevel.VIEW,
        ],
        addedAt: props.modelValue[userId]?.addedAt || new Date(),
        addedBy: props.modelValue[userId]?.addedBy || props.currentUserId,
      };
    });

    emit("update:modelValue", updatedPermissions);
  };

  function arePermissionsEqual(perms1: string[], perms2: string[]): boolean {
    if (perms1.length !== perms2.length) return false;
    return (
      perms1.every((p) => perms2.includes(p)) &&
      perms2.every((p) => perms1.includes(p))
    );
  }

  watch(
    () => selectedPermissions.value,
    (newPermissions) => {
      Object.entries(newPermissions).forEach(([userId, permissions]) => {
        if (
          sharedUsers.value[userId] &&
          !arePermissionsEqual(
            permissions,
            sharedUsers.value[userId].permissions
          )
        ) {
          sharedUsers.value[userId].permissions = [...permissions];
          emit("update-permissions", { userId, permissions });
        }
      });
      updateModelValue();
    },
    { deep: true }
  );

  return {
    userEmail,
    selectedPermissions,
    sharedUsers,
    searchResults,
    searchLoading,
    searchError,
    loadingUserData,
    permissionOptions,
    searchUsers,
    addUser,
    selectUser,
    removeUser,
  };
}
