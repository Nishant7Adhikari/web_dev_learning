/**
 * Signs up a new user by checking for an existing email and then inserting into the 'users' table.
 * @param {object} profileData - Contains email, password, name, phone, etc.
 * @returns {object} The newly created user object.
 */
async function signUp(profileData) {
    const { email } = profileData;

    // 1. Check if the email already exists in our table.
    const { data: existingUsers, error: checkError } = await supabaseClient
        .from('users')
        .select('email')
        .eq('email', email);

    if (checkError) {
        console.error("Error checking for existing user:", checkError);
        throw new Error("Could not sign up. Please try again.");
    }

    if (existingUsers && existingUsers.length > 0) {
        throw new Error("An account with this email already exists.");
    }

    // 2. If email is unique, insert the new user data.
    // The password is saved as plain text. THIS IS INSECURE.
    const { data: newUser, error: insertError } = await supabaseClient
        .from('users')
        .insert([profileData])
        .select()
        .single(); // .single() returns the created object

    if (insertError) {
        console.error("Error creating new user:", insertError);
        throw new Error("Could not sign up. Please try again.");
    }

    return newUser;
}

/**
 * Signs in a user by selecting from the 'users' table where email and password match.
 * @param {string} email - The user's email.
 * @param {string} password - The user's plain text password.
 * @returns {object} The user object if credentials are correct.
 */
async function signIn(email, password) {
    const { data: user, error } = await supabaseClient
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('password', password) // INSECURE: Checking plain text password.
        .single(); // Expecting only one user

    if (error || !user) {
        console.error("Login failed:", error);
        throw new Error("Invalid email or password.");
    }

    return user;
}

/**
 * "Signs out" the user by clearing their data from Local Storage.
 */
function signOut() {
    localStorage.removeItem('currentUser');
    // We will reload the page to reset the application state.
    window.location.reload();
}

/**
 * Checks Local Storage to see if a user session exists.
 * @returns {object|null} The user object from storage, or null.
 */
function getCurrentUser() {
    const user = localStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
}