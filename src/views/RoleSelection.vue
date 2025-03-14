<script lang="ts" setup>
import {Button, Card, Message, Select} from "primevue";
import {Form} from "@primevue/forms";
import PageWrapper from "../components/library/PageWrapper.vue";
import {reactive, ref} from "vue";
import {zodResolver} from "@primevue/forms/resolvers/zod"
import {assignRoleAndCreateUserDocument} from "../models/User.ts";
import {useRouter} from "vue-router";
import {z} from "zod";
import {GeneralErrors} from "../constants/errors.ts";
import {useAuthenticatedUser} from "../composables/useAuthGuard.ts";

const user = useAuthenticatedUser();
const router = useRouter()

const formSchema = z.object({
  role: z.string().nullable()
      .transform(val => val || '')
      .refine(val => val.length > 0, {
        message: GeneralErrors.ROLE_REQUIRED_ERROR
      })
});

type FormSchemaType = z.infer<typeof formSchema>;
const formValues = reactive<FormSchemaType>({role: ''});
const resolver = ref(zodResolver(formSchema));

async function onFormSubmit() {
  try {
    await assignRoleAndCreateUserDocument(user, formValues.role);
    await router.push({name: 'Home'});
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
        <Form v-slot="$form" v-model="formValues" :resolver class="flex flex-col gap-4 w-full sm:w-56"
              @submit="onFormSubmit">
          <Select v-model="formValues.role" :options="['Doctor', 'Patient']" fluid name="role" placeholder="Select Role"
                  required/>
          <Message v-if="$form.role?.invalid" severity="error" size="small" variant="simple">{{
              $form.role.error.message
            }}
          </Message>
          <Button label="Submit" severity="primary" type="submit"/>
        </Form>
      </template>
    </Card>
  </PageWrapper>
</template>

<style scoped>

</style>