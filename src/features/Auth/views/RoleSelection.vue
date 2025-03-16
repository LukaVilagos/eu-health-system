<script lang="ts" setup>
import { Button, Card, Message, Select } from "primevue";
import { Form } from "@primevue/forms";
import PageWrapper from "../../../components/ui/PageWrapper.vue";
import { reactive, ref } from "vue";
import { zodResolver } from "@primevue/forms/resolvers/zod"
import { UserRoles } from "../../../models/User.ts";
import { z } from "zod";
import { GeneralErrors } from "../../../constants/errors.ts";
import { useTypedRouter } from "../../../composables/useTypedRouter.ts";
import { useAssignRoleAndCreateUserMutation } from "../../../queries/queryUser.ts";
import { useAuthUser } from "../../../composables/useAuth.ts";

const { user, isLoading } = useAuthUser();
const router = useTypedRouter()

const formSchema = z.object({
  role: z.string().nullable()
    .transform(val => val || '')
    .refine(val => val.length > 0, {
      message: GeneralErrors.ROLE_REQUIRED_ERROR
    })
});

type FormSchemaType = z.infer<typeof formSchema>;
const formValues = reactive<FormSchemaType>({ role: '' });
const resolver = ref(zodResolver(formSchema));

const { mutateAsync: assignRoleAndCreateUserDocumentMutation, isPending } = useAssignRoleAndCreateUserMutation();

async function onFormSubmit() {
  try {
    if (!user.value) {
      throw new Error("User is not authenticated");
    }

    if (!formValues.role) {
      return;
    }

    await assignRoleAndCreateUserDocumentMutation({
      user: user.value,
      role: formValues.role
    });

    await router.typedPush({
      name: 'Home',
      params: {}
    });
  } catch (error) {
    console.error("Error creating user document:", error);
  }
}

</script>

<template>
  <PageWrapper>
    <Card>
      <template #title>Role Selection</template>
      <template #subtitle>Select your role</template>
      />
      <template #content>
        <div v-if="isLoading || isPending" class="flex justify-center">
          <i class="pi pi-spin pi-spinner text-2xl"></i>
        </div>
        <Form v-else v-slot="$form" v-model="formValues" :resolver class="flex flex-col gap-4 w-full sm:w-56"
          @submit="onFormSubmit">
          <Select v-model="formValues.role" :options="Object.values(UserRoles)" fluid name="role"
            placeholder="Select Role" required />
          <Message v-if="$form.role?.invalid" severity="error" size="small" variant="simple">{{
            $form.role.error.message
          }}
          </Message>
          <Button label="Submit" severity="primary" type="submit" :disabled="isPending" />
        </Form>
      </template>
    </Card>
  </PageWrapper>
</template>