<script lang="ts" setup>
import {Button, Card, Message, Select} from "primevue";
import {Form} from "@primevue/forms";
import PageWrapper from "../components/library/PageWrapper.vue";
import {useRouter} from "vue-router";
import {doc, setDoc} from "firebase/firestore";
import {db} from "../firebase/app.ts";
import {inject, reactive, ref} from "vue";
import {zodResolver} from "@primevue/forms/resolvers/zod"
import {z} from "zod";
import {authKey} from "../composables/authKey.ts";

const auth = inject(authKey);

if (!auth) {
  throw new Error('Auth was not provided');
}

const {user} = auth;
const router = useRouter();

const ROLE_REQUIRED_ERROR = 'Role is required.';

const formSchema = z.object({
  role: z.string().nonempty(ROLE_REQUIRED_ERROR)
});

type FormValues = z.infer<typeof formSchema>;

const formValues = reactive<FormValues>({role: ''});

const resolver = ref(zodResolver(formSchema));

async function assignRoleAndCreateUserDocument(role: string) {
  if (user?.value) {
    const userDocRef = doc(db, 'users', user.value.uid);
    await setDoc(userDocRef, {
      uid: user.value.uid,
      email: user.value.email,
      displayName: user.value.displayName,
      role,
      createdAt: new Date()
    });
    await router.push({name: 'Home'});
  }
}

async function onFormSubmit() {
  await assignRoleAndCreateUserDocument(formValues.role);
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