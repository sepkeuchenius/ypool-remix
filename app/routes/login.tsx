import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useLoaderData, useSearchParams } from "@remix-run/react";
import { authenticator, User } from "~/services/auth.server";
import { Submit } from "./submit";
import { AuthorizationError } from "remix-auth";
import { FirebaseError } from "firebase/app";

// First we create our UI with the form doing a POST and the inputs with the
// names we are going to use in the strategy
export default function Screen() {
  const [searchParams, setSearchParams] = useSearchParams();
  const actionData = useActionData<typeof action>()
  const error = searchParams.get("error");
  return (
    <div className="p-10 flex-row content-center flex grid">
      <div className=" w-full content-center text-center flex flex-col items-center ">
        <div className="text-4xl m-10">Log in</div>
        {error && <div className="text-red-500">{error}</div>}
        <Form method="post" className="flex flex-col w-64">
          {
            actionData ? <div className="text-red-500">{actionData.error}</div> : null
          }
          <div className="flex flex-col my-10">
            <input type="email" name="email" required className="bg-white px-5 py-2 border-2 border-slate-700 rounded-l m-3" />
            <input className="bg-white px-5 py-2 border-2 border-slate-700 rounded-l m-3"
              type="password"
              name="password"
              autoComplete="current-password"
              required
            />
          </div>
          <Submit value="Login" />
        </Form>
      </div>
    </div>
  );
}


// Second, we need to export an action function, here we will use the
// `authenticator.authenticate method`
export async function action({ request }: ActionFunctionArgs) {
  // we call the method with the name of the strategy we want to use and the
  // request object, optionally we pass an object with the URLs we want the user
  // to be redirected to after a success or a failure
  try {
    await authenticator.authenticate("user-pass", request, {
      successRedirect: "/dashboard/alltime/0",
      throwOnError: true
    });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      if (error.cause && error.cause instanceof FirebaseError) {
        return { error: error.cause.code }
      }
    }
    throw error;
  }

  return { error: null }
};

// Finally, we can export a loader function where we check if the user is
// authenticated with `authenticator.isAuthenticated` and redirect to the
// dashboard if it is or return null if it's not
export async function loader({ request, params }: LoaderFunctionArgs) {
  // If the user is already authenticated redirect to /dashboard directly
  let authenticated = await authenticator.isAuthenticated(request, {
    successRedirect: "/dashboard/alltime/0",
  });

  return { error: params.error }
};