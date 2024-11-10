@group(0) @binding(0) var color_buffer: texture_storage_2d<rgba8unorm, write>;
@group(0) @binding(1) var<uniform> movement: Movement;
@group(0) @binding(2) var<uniform> rotation: Rotation;
@group(0) @binding(3) var<uniform> pars: Pars;

struct Ray {
    direction: vec3<f32>,
    origin: vec3<f32>,
}

struct Movement {
    view: vec3<f32>,
}
struct Rotation {
    rot: mat4x4<f32>,
}
struct Pars {
    pars: vec3<f32>,
}

@compute @workgroup_size(8,8,1)
fn main(@builtin(global_invocation_id) GlobalInvocationID: vec3<u32>) {

    let screen_size: vec2<i32> = vec2<i32>(textureDimensions(color_buffer));
    let screen_pos: vec2<i32> = vec2<i32>(i32(GlobalInvocationID.x), i32(GlobalInvocationID.y));

    if screen_pos.x >= screen_size.x || screen_pos.y >= screen_size.y {
        return;
    }

    // screen coords -> [-0.5 .. 0.5]
    let offset_x = (f32(screen_pos.x) - f32(screen_size.x) / 2.);
    let offset_y = (f32(screen_pos.y) - f32(screen_size.y) / 2.);
    let horizontal_coefficient: f32 = offset_x / f32(screen_size.x);
    let vertical_coefficient: f32 = offset_y / f32(screen_size.x);

    // 3d span
    let forwards: vec3<f32> = vec3<f32>(0.0, 0.0, -1.0);
    let right: vec3<f32> = vec3<f32>(1.0, 0.0, 0.0);
    let up: vec3<f32> = vec3<f32>(0.0, 1.0, 0.0);

    // vector goes from screen inwards (opposite to observer), by `forwards` length
    var myRay: Ray;
    let v = forwards + horizontal_coefficient * right + vertical_coefficient * up;
    myRay.direction = normalize(v);
    // vector starts at pixel
    myRay.origin = horizontal_coefficient * right + vertical_coefficient * up;

    let background = vec4<f32>(0.0, 0.0, 0.0, 1.0);
    var pixel_color: vec4<f32> = background;

    var mov = movement.view;

    let internal_scaling_factor = 12.0;
    myRay.direction *= internal_scaling_factor;
    mov *= internal_scaling_factor /  4.0;

    // move
    myRay.direction.z += mov.z;
    myRay.direction.y += mov.y;
    myRay.direction.x += mov.x;

    // rotate
    let rotated_4 = rotation.rot * vec4<f32>(myRay.direction, 1.0);
    var rotated_3 = vec3<f32>(rotated_4.x, rotated_4.y, rotated_4.z);
    
    // step back a little, to have a better view
    // rotated_3.z += 2.; 
    rotated_3.z += 12.; 

    // // collect evenly spaced values along ray
    // let array_length = 100;
    // var pds = array<f32, 100>();
    // let start = rotated_3.z;
    // let segment_length = 1.0;
    // for (var i = 0; i < array_length; i += 1) {
    //     // advance a step on z
    //     let z_offset = f32(i) * segment_length;
    //     rotated_3.z = start + z_offset;
    //     // calculate pdf
    //     let spheric_coords = to_spheric_coords(rotated_3);
    //     let pd = pd(spheric_coords, u32(pars.pars[0]), u32(pars.pars[1]), i32(pars.pars[2]));
    //     // multiply pdf by segment length and store
    //     pds[i] = pd * segment_length;
    // }

    // // sum all segments
    // var pd_sum: f32 = 0.0;
    // for (var i = 0; i < array_length; i += 1) {
    //     pd_sum = pd_sum + pds[i];
    // }
    
    let spheric_coords = to_spheric_coords(rotated_3);
    let pd = pd(spheric_coords, u32(pars.pars[0]), u32(pars.pars[1]), i32(pars.pars[2]));
    let pd_sum = pd;

    // map to pixel color
    let brightener = 500.0;
    let pd_color = vec4<f32>(0.5, 0.5, 1.0, pd_sum * brightener);
    pixel_color = mix(background, pd_color, pd_color.a);

    // pixel_color = background;
    // if pd > 0.001 {
    //     pixel_color = vec4<f32>(1.0, 0.0, 0.0, 1.0);
    // }

    textureStore(color_buffer, screen_pos, pixel_color);
}

fn to_spheric_coords(coords: vec3<f32>) -> SphericCoords {
    let rad = sqrt(pow(coords.x, 2.0) + pow(coords.y, 2.0) + pow(coords.z, 2.0));
    let theta = atan(coords.y / coords.x);
    let phi = acos(coords.z / rad);
    return SphericCoords(rad, theta, phi);
}

struct SphericCoords {
    rad: f32,
    theta: f32,
    phi: f32
}

fn pd(coords: SphericCoords, n: u32, l: u32, m: i32) -> f32 {
    let p = psi(coords, n, l, m);
    return pow(abs(p), 2.0);
}

fn psi(coords: SphericCoords, n: u32, l: u32, m: i32) -> Complex {
    let rad = coords.rad;
    let theta = coords.theta;
    let phi = coords.phi;

    let e = 2.71828;
    // https://en.wikipedia.org/wiki/Bohr_radius#Reduced_Bohr_radius
    // let rbr = 5.29177210544e-11;
    // we can set the reduced bohr radius to 1, allowing to pass radius in the same
    let rbr = 1.;
    let nf = f32(n);

    // left part under square root
    // these terms don't have any meaning other than internal grouping here
    let term1 = pow(2. / nf * rbr, 3.0);
    let term2 = f32(factorial(n - l - 1)) / f32(((2 * n) * factorial(n + l)));
    let term3 = sqrt(term1 * term2);

    let p = (2. * rad) / (nf * rbr);
    let term4 = pow(e, -p / 2.0);
    let term5 = term4 * pow(p, f32(l));
    let term6 = term3 * term5;

    // can do n - l - 1 because we checked n > l
    let term7 = laguerre_pol(n - l - 1, p);
    let term8 = spheric_harmonic(l, m, theta, phi);

    return mul(term8, term6 * term7);
}

// https://en.wikipedia.org/wiki/Laguerre_polynomials#The_first_few_polynomials
fn laguerre_pol(n: u32, x: f32) -> f32 {
    switch n {
        case 0: {
            return 1.0;
        }
        case 1: {
            return -x + 1.0;
        }
        case 2: {
            return 1. / 2. * (pow(x, 2) - 4. * x + 2.);
        }
        case 3: {
            return 1. / 6. * (pow(x, 3) + 9. * pow(x, 2) - 18. * x + 6.);
        }
        case 4: {
            return 1. / 24. * (pow(x, 4.0) - 16. * pow(x, 3.0) + 72. * pow(x, 2.0) - 96. * x + 24.);
        }
        default: {
            // error
            return 0;
        }
    }
}

// https://en.wikipedia.org/wiki/Table_of_spherical_harmonics#Complex_spherical_harmonics
fn spheric_harmonic(l: u32, m: i32, theta: f32, phi: f32) -> Complex {
    // quick access
    let oh = 1. / 2.; // one half

    let pi = 3.14159;

    let ex = Complex(0., -phi); // exponent (part)

    switch l {
        case 0 : {
            switch m {
                case 0 : {
                    return Complex(oh * sqrt(1. / pi), 0.);
                }
                default: {
                    // error
                    return Complex(0., 0.);
                }
            }
        }
        case 1 : {
            switch m {
                case -1 : {
                    return mul(e_to_i_pow(neg(ex)), oh * sqrt(3. / (2. * pi)) * sin(theta));
                }
                case 0 : {
                    let real = oh * sqrt(3. / pi) * cos(theta);
                    return Complex(real, 1.);
                }
                case 1 : {
                    return mul(e_to_i_pow(ex), -oh * sqrt(3. / (2. * pi)) * sin(theta));
                }
                default: {
                    // error
                    return Complex(0., 0.);
                }
            }
        }
        case 2 : {
            switch m {
                case -2 : {
                    let ex = Complex(0., -2. * phi);
                    return mul(
                        e_to_i_pow(ex),
                        1. / 4. * sqrt(15. / (2. * pi)) * pow(sin(theta), 2.),
                    );
                }

                case -1 : {
                    let ex = Complex(0., -phi);
                    return mul(
                        e_to_i_pow(ex),
                        oh * sqrt(15. / (2. * pi)) * sin(theta) * cos(theta),
                    );
                }
                case 0 : {
                    return Complex(
                        1. / 4. * sqrt(5. / pi) * (3. * pow(cos(theta), 2.) - 1.),
                        0.,
                    );
                }
                case 1 : {
                    let ex = Complex(0., phi);
                    return mul(
                        e_to_i_pow(ex),
                        -oh * sqrt(15. / (2. * pi)) * sin(theta) * cos(theta),
                    );
                }
                case 2 : {
                    let ex = Complex(0., 2. * phi);
                    return mul(
                        e_to_i_pow(ex),
                        1. / 4. * sqrt(15. / (2. * pi)) * pow(sin(theta), 2.),
                    );
                }
                default: {
                    // error
                    return Complex(0., 0.);
                }
            }
        }
        default: {
            // error
            return Complex(0., 0.);
        }
    }
}


struct Complex {
    real: f32,
    complex: f32
}

fn create_i() -> Complex {
    return Complex(0, 1);
}

fn e_to_i_pow(c: Complex) -> Complex {
    // e^ix = cos x + isin x, where x = i_multiplier
    return Complex(cos(c.real), sin(c.complex));
}

fn neg(c: Complex) -> Complex {
    return Complex(-c.real, -c.complex);
}

fn mul(c: Complex, r: f32) -> Complex {
    return Complex(c.real * r, -c.complex * r);
}

fn abs(c: Complex) -> f32 {
    return sqrt(pow(c.real, 2.) + pow(c.complex, 2.));
}

fn factorial(n: u32) -> u32 {
    switch n {
        case 0: {return 1;}
        case 1: {return 1;}
        case 2: {return 2;}
        case 3: {return 6;}
        case 4: {return 24;}
        case 5: {return 120;}
        // TODO error
        default: {return 0;}
    }
}
